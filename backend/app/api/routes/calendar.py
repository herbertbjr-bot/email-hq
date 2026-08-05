from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_calendar_event_or_404
from app.db.database import get_db
from app.models.calendar import CalendarEvent
from app.schemas.calendar import CalendarEventCreate, CalendarEventOut, CalendarEventUpdate, _ensure_utc

router = APIRouter(prefix="/calendar/events", tags=["calendar"])


@router.get("", response_model=list[CalendarEventOut])
async def list_events(db: AsyncSession = Depends(get_db)) -> list[CalendarEvent]:
    result = await db.execute(select(CalendarEvent).order_by(CalendarEvent.start_at))
    return list(result.scalars().all())


@router.post("", response_model=CalendarEventOut, status_code=status.HTTP_201_CREATED)
async def create_event(payload: CalendarEventCreate, db: AsyncSession = Depends(get_db)) -> CalendarEvent:
    event = CalendarEvent(**payload.model_dump())
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.get("/{event_id}", response_model=CalendarEventOut)
async def get_event(event: CalendarEvent = Depends(get_calendar_event_or_404)) -> CalendarEvent:
    return event


@router.patch("/{event_id}", response_model=CalendarEventOut)
async def update_event(
    payload: CalendarEventUpdate,
    event: CalendarEvent = Depends(get_calendar_event_or_404),
    db: AsyncSession = Depends(get_db),
) -> CalendarEvent:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(event, field, value)

    # Re-check against the merged state, not just the payload - catches a
    # PATCH that only moves one of start_at/end_at into conflict with the
    # other's already-stored value (CalendarEventUpdate's validator only
    # sees fields present in this one payload). _ensure_utc guards against
    # comparing a field this payload just set (aware) with one still
    # holding whatever SQLite handed back on load (naive) - see its
    # docstring in schemas/calendar.py.
    if _ensure_utc(event.end_at) <= _ensure_utc(event.start_at):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="end_at must be after start_at")

    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event: CalendarEvent = Depends(get_calendar_event_or_404), db: AsyncSession = Depends(get_db)
) -> None:
    await db.delete(event)
    await db.commit()
