from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    notes: str | None = None
    due_date: date | None = None


class TaskCreate(TaskBase):
    """source_* fields are set when a task is created from a message (e.g.
    the Mail toolbar's Task button) - all optional, since a task can just as
    well be created standalone from the Tasks view.
    """

    source_account_id: str | None = None
    source_folder: str | None = None
    source_uid: str | None = None
    source_subject: str | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    notes: str | None = None
    due_date: date | None = None
    is_done: bool | None = None


class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    is_done: bool
    source_account_id: str | None
    source_folder: str | None
    source_uid: str | None
    source_subject: str | None
    created_at: datetime
    updated_at: datetime
