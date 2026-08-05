from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.account import EmailAccount
from app.models.calendar import CalendarEvent
from app.models.task import Task


async def get_account_or_404(account_id: str, db: AsyncSession = Depends(get_db)) -> EmailAccount:
    account = await db.get(EmailAccount, account_id)
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email account not found")
    return account


async def get_task_or_404(task_id: str, db: AsyncSession = Depends(get_db)) -> Task:
    task = await db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


async def get_calendar_event_or_404(event_id: str, db: AsyncSession = Depends(get_db)) -> CalendarEvent:
    event = await db.get(CalendarEvent, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar event not found")
    return event
