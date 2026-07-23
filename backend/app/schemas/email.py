from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class FolderOut(BaseModel):
    name: str
    display_name: str
    unread_count: int = 0
    total_count: int = 0


class MessageSummary(BaseModel):
    uid: str
    subject: str
    sender_name: str | None = None
    sender_address: EmailStr | str
    recipients: list[str] = Field(default_factory=list)
    date: datetime | None = None
    snippet: str = ""
    is_read: bool = False
    is_flagged: bool = False
    has_attachments: bool = False

    # AI-enrichment fields - populated by app.services.ai.* once real models
    # are wired in. All default to None/empty so the API contract is stable
    # whether or not AI features are enabled.
    ai_tags: list[str] = Field(default_factory=list)
    ai_priority: str | None = None  # "low" | "normal" | "high" | "urgent"
    ai_priority_score: float | None = None


class MessageDetail(MessageSummary):
    body_text: str | None = None
    body_html: str | None = None
    attachments: list[str] = Field(default_factory=list)


class MessageListResponse(BaseModel):
    folder: str
    total: int
    messages: list[MessageSummary]


class SendMessageRequest(BaseModel):
    to: list[EmailStr]
    cc: list[EmailStr] = Field(default_factory=list)
    bcc: list[EmailStr] = Field(default_factory=list)
    subject: str
    body_text: str
    body_html: str | None = None
    in_reply_to: str | None = None


class MessageFlagUpdate(BaseModel):
    is_read: bool | None = None
    is_flagged: bool | None = None


class MessageMoveRequest(BaseModel):
    target_folder: str = Field(min_length=1)
