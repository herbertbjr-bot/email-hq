"""SMTP mail sending via aiosmtplib (native asyncio, STARTTLS/SSL enforced)."""

from __future__ import annotations

import logging
from email.message import EmailMessage

import aiosmtplib

from app.core.security import decrypt_secret
from app.models.account import EmailAccount
from app.schemas.email import SendMessageRequest

logger = logging.getLogger("emailhq.smtp")


class SmtpError(Exception):
    pass


def _build_message(account: EmailAccount, payload: SendMessageRequest) -> EmailMessage:
    msg = EmailMessage()
    msg["From"] = account.email_address
    msg["To"] = ", ".join(payload.to)
    if payload.cc:
        msg["Cc"] = ", ".join(payload.cc)
    msg["Subject"] = payload.subject
    if payload.in_reply_to:
        msg["In-Reply-To"] = payload.in_reply_to
        msg["References"] = payload.in_reply_to

    msg.set_content(payload.body_text)
    if payload.body_html:
        msg.add_alternative(payload.body_html, subtype="html")

    return msg


async def send_message(account: EmailAccount, payload: SendMessageRequest) -> None:
    password = decrypt_secret(account.smtp_password_encrypted)
    msg = _build_message(account, payload)
    recipients = [*payload.to, *payload.cc, *payload.bcc]

    try:
        await aiosmtplib.send(
            msg,
            hostname=account.smtp_host,
            port=account.smtp_port,
            username=account.smtp_username,
            password=password,
            start_tls=account.smtp_use_tls,
            recipients=recipients,
        )
    except (aiosmtplib.SMTPException, OSError) as exc:
        raise SmtpError(f"Failed to send message: {exc}") from exc


async def test_connection(account: EmailAccount) -> tuple[bool, str | None]:
    password = decrypt_secret(account.smtp_password_encrypted)
    try:
        smtp = aiosmtplib.SMTP(hostname=account.smtp_host, port=account.smtp_port, start_tls=account.smtp_use_tls)
        await smtp.connect()
        await smtp.login(account.smtp_username, password)
        await smtp.quit()
        return True, None
    except (aiosmtplib.SMTPException, OSError) as exc:
        return False, str(exc)
