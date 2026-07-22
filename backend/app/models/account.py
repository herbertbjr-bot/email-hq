import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class AccountProfile(str, enum.Enum):
    PERSONAL = "personal"
    BUSINESS = "business"
    OTHER = "other"


class EmailAccount(Base):
    """A configured mailbox (IMAP + SMTP) belonging to one profile.

    SMTP/IMAP passwords are stored only in encrypted form via
    app.core.security.encrypt_secret/decrypt_secret - never in plaintext.
    """

    __tablename__ = "email_accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    label: Mapped[str] = mapped_column(String(120), nullable=False)
    email_address: Mapped[str] = mapped_column(String(320), nullable=False, index=True)
    profile: Mapped[AccountProfile] = mapped_column(
        Enum(AccountProfile), default=AccountProfile.PERSONAL, nullable=False
    )
    color: Mapped[str] = mapped_column(String(16), default="#4f46e5")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    imap_host: Mapped[str] = mapped_column(String(255), nullable=False)
    imap_port: Mapped[int] = mapped_column(Integer, default=993)
    imap_use_ssl: Mapped[bool] = mapped_column(Boolean, default=True)
    imap_username: Mapped[str] = mapped_column(String(320), nullable=False)
    imap_password_encrypted: Mapped[str] = mapped_column(String(1024), nullable=False)

    smtp_host: Mapped[str] = mapped_column(String(255), nullable=False)
    smtp_port: Mapped[int] = mapped_column(Integer, default=587)
    smtp_use_tls: Mapped[bool] = mapped_column(Boolean, default=True)
    smtp_username: Mapped[str] = mapped_column(String(320), nullable=False)
    smtp_password_encrypted: Mapped[str] = mapped_column(String(1024), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)
