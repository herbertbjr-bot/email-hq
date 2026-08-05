import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class CalendarEvent(Base):
    """A single calendar event, optionally linked back to the email it was
    scheduled from.

    No recurrence support in v1 - RRULE parsing and timezone edge cases are
    real complexity that isn't worth it before a single-event calendar
    proves useful (same call as Task skipping a separate "lists" entity).
    Each row is one occurrence. Mail isn't stored locally (see
    imap_service - fetched live from IMAP), so the link to a source message
    is the same loose account/folder/uid pointer Task uses, plus a
    denormalized subject snapshot.
    """

    __tablename__ = "calendar_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, default=None)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    all_day: Mapped[bool] = mapped_column(Boolean, default=False)

    source_account_id: Mapped[str | None] = mapped_column(String(36), default=None)
    source_folder: Mapped[str | None] = mapped_column(String(255), default=None)
    source_uid: Mapped[str | None] = mapped_column(String(64), default=None)
    source_subject: Mapped[str | None] = mapped_column(String(998), default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)
