from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.account import AccountProfile


class EmailAccountBase(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    email_address: EmailStr
    profile: AccountProfile = AccountProfile.PERSONAL
    color: str = Field(default="#4f46e5", max_length=16)
    is_default: bool = False

    imap_host: str
    imap_port: int = 993
    imap_use_ssl: bool = True
    imap_username: str

    smtp_host: str
    smtp_port: int = 587
    smtp_use_tls: bool = True
    smtp_username: str


class EmailAccountCreate(EmailAccountBase):
    imap_password: str = Field(min_length=1, description="Plaintext password, encrypted before storage")
    smtp_password: str = Field(min_length=1, description="Plaintext password, encrypted before storage")


class EmailAccountUpdate(BaseModel):
    label: str | None = None
    profile: AccountProfile | None = None
    color: str | None = None
    is_default: bool | None = None

    imap_host: str | None = None
    imap_port: int | None = None
    imap_use_ssl: bool | None = None
    imap_username: str | None = None
    imap_password: str | None = None

    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_use_tls: bool | None = None
    smtp_username: str | None = None
    smtp_password: str | None = None


class EmailAccountOut(EmailAccountBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class ConnectionTestResult(BaseModel):
    imap_ok: bool
    smtp_ok: bool
    imap_error: str | None = None
    smtp_error: str | None = None


class ConnectionTestRequest(BaseModel):
    """IMAP/SMTP fields only - used to test credentials before an account is saved."""

    imap_host: str
    imap_port: int = 993
    imap_use_ssl: bool = True
    imap_username: str
    imap_password: str = Field(min_length=1)

    smtp_host: str
    smtp_port: int = 587
    smtp_use_tls: bool = True
    smtp_username: str
    smtp_password: str = Field(min_length=1)
