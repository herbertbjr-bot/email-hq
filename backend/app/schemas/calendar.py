from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def _ensure_utc(value: datetime) -> datetime:
    """SQLite drops tzinfo on round-trip (Postgres in production does not),
    so a value read back from storage can arrive here naive. Every datetime
    this app ever writes is normalized to UTC first, so re-marking a naive
    value as UTC here is a safe assumption, not a guess - and it's what
    keeps CalendarEventOut responses from silently losing their offset,
    which would make a JS `new Date(...)` on the frontend misparse them as
    local time instead of UTC.
    """
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


class CalendarEventBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    notes: str | None = None
    start_at: datetime
    end_at: datetime
    all_day: bool = False

    @field_validator("start_at", "end_at")
    @classmethod
    def _normalize_tz(cls, value: datetime) -> datetime:
        return _ensure_utc(value)


class CalendarEventCreate(CalendarEventBase):
    """source_* fields are set when an event is created from a message (e.g.
    the Mail toolbar's Schedule button) - all optional, since an event can
    just as well be created standalone from the Calendar view.
    """

    source_account_id: str | None = None
    source_folder: str | None = None
    source_uid: str | None = None
    source_subject: str | None = None

    @model_validator(mode="after")
    def _check_end_after_start(self) -> "CalendarEventCreate":
        if self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at")
        return self


class CalendarEventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    notes: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    all_day: bool | None = None

    @field_validator("start_at", "end_at")
    @classmethod
    def _normalize_tz(cls, value: datetime | None) -> datetime | None:
        return _ensure_utc(value) if value is not None else None

    @model_validator(mode="after")
    def _check_end_after_start(self) -> "CalendarEventUpdate":
        # Only catches the case where both are given in the same payload -
        # if just one changes, the route re-checks against the stored
        # value after merging (see update_event in routes/calendar.py).
        if self.start_at is not None and self.end_at is not None and self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at")
        return self


class CalendarEventOut(CalendarEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_account_id: str | None
    source_folder: str | None
    source_uid: str | None
    source_subject: str | None
    created_at: datetime
    updated_at: datetime
