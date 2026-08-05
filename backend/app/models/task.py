import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Task(Base):
    """A to-do item, optionally linked back to the email it was created from.

    Mail messages aren't stored locally (see imap_service - they're fetched
    live from IMAP on demand), so the link to a source message can't be a
    normal foreign key to a message row. Instead it's a loose pointer -
    account/folder/uid, the same triple MessageView already uses to open a
    message - plus a denormalized snapshot of the subject line so a task
    list can show "from: <subject>" without a live IMAP fetch, and still
    means something if the source message is later moved or deleted.
    """

    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, default=None)
    is_done: Mapped[bool] = mapped_column(Boolean, default=False)
    due_date: Mapped[date | None] = mapped_column(Date, default=None)

    source_account_id: Mapped[str | None] = mapped_column(String(36), default=None)
    source_folder: Mapped[str | None] = mapped_column(String(255), default=None)
    source_uid: Mapped[str | None] = mapped_column(String(64), default=None)
    source_subject: Mapped[str | None] = mapped_column(String(998), default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)
