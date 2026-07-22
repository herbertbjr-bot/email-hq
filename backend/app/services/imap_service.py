"""IMAP mail retrieval.

All network I/O uses the standard library's imaplib over SSL and is executed
in a worker thread via asyncio.to_thread so the async FastAPI event loop is
never blocked by blocking socket calls. Credentials are decrypted only for
the duration of a single connection and are never logged.
"""

from __future__ import annotations

import asyncio
import email
import imaplib
import logging
from datetime import datetime
from email.header import decode_header, make_header
from email.message import Message
from email.utils import parsedate_to_datetime

from app.core.security import decrypt_secret
from app.models.account import EmailAccount
from app.schemas.email import FolderOut, MessageDetail, MessageListResponse, MessageSummary

logger = logging.getLogger("emailhq.imap")

# Folders commonly present across providers, used to give friendlier display names.
_DISPLAY_NAME_OVERRIDES = {
    "INBOX": "Inbox",
    "SENT": "Sent",
    "DRAFTS": "Drafts",
    "TRASH": "Trash",
    "JUNK": "Spam",
    "SPAM": "Spam",
    "ARCHIVE": "Archive",
}


class ImapError(Exception):
    pass


def _decode_str(value: str | None) -> str:
    if not value:
        return ""
    try:
        return str(make_header(decode_header(value)))
    except Exception:
        return value


def _connect(account: EmailAccount) -> imaplib.IMAP4:
    password = decrypt_secret(account.imap_password_encrypted)
    try:
        if account.imap_use_ssl:
            conn = imaplib.IMAP4_SSL(account.imap_host, account.imap_port)
        else:
            conn = imaplib.IMAP4(account.imap_host, account.imap_port)
            conn.starttls()
        conn.login(account.imap_username, password)
        return conn
    except (imaplib.IMAP4.error, OSError) as exc:
        raise ImapError(f"Could not connect to IMAP server: {exc}") from exc


def _display_name(folder_name: str) -> str:
    return _DISPLAY_NAME_OVERRIDES.get(folder_name.upper(), folder_name)


def _parse_folder_line(line: bytes) -> str | None:
    try:
        decoded = line.decode("utf-8", errors="replace")
        # Format: (\Flags) "/" "FolderName"
        parts = decoded.split(' "/" ')
        if len(parts) < 2:
            parts = decoded.split(' "." ')
        if len(parts) < 2:
            return None
        name = parts[-1].strip().strip('"')
        return name
    except Exception:
        return None


def _sync_list_folders(account: EmailAccount) -> list[FolderOut]:
    conn = _connect(account)
    try:
        status, folder_lines = conn.list()
        if status != "OK":
            raise ImapError("Failed to list folders")

        folders: list[FolderOut] = []
        for line in folder_lines or []:
            name = _parse_folder_line(line)
            if not name:
                continue
            unread = total = 0
            try:
                status, data = conn.select(f'"{name}"', readonly=True)
                if status == "OK":
                    total = int(data[0])
                    status_res, status_data = conn.status(f'"{name}"', "(UNSEEN)")
                    if status_res == "OK" and status_data and status_data[0]:
                        text = status_data[0].decode("utf-8", errors="replace")
                        if "UNSEEN" in text:
                            unread = int(text.split("UNSEEN")[1].split(")")[0].strip())
            except (imaplib.IMAP4.error, ValueError):
                pass
            folders.append(
                FolderOut(name=name, display_name=_display_name(name), unread_count=unread, total_count=total)
            )
        return folders
    finally:
        try:
            conn.logout()
        except Exception:
            pass


def _extract_body_and_attachments(msg: Message) -> tuple[str | None, str | None, list[str], bool]:
    body_text = None
    body_html = None
    attachments: list[str] = []

    if msg.is_multipart():
        for part in msg.walk():
            content_disposition = str(part.get("Content-Disposition") or "")
            content_type = part.get_content_type()

            if "attachment" in content_disposition:
                filename = part.get_filename()
                if filename:
                    attachments.append(_decode_str(filename))
                continue

            if content_type == "text/plain" and body_text is None:
                payload = part.get_payload(decode=True)
                if payload is not None:
                    body_text = payload.decode(part.get_content_charset() or "utf-8", errors="replace")
            elif content_type == "text/html" and body_html is None:
                payload = part.get_payload(decode=True)
                if payload is not None:
                    body_html = payload.decode(part.get_content_charset() or "utf-8", errors="replace")
    else:
        payload = msg.get_payload(decode=True)
        if payload is not None:
            text = payload.decode(msg.get_content_charset() or "utf-8", errors="replace")
            if msg.get_content_type() == "text/html":
                body_html = text
            else:
                body_text = text

    return body_text, body_html, attachments, bool(attachments)


def _parse_message(uid: str, raw: bytes, flags: tuple[bytes, ...]) -> MessageDetail:
    msg = email.message_from_bytes(raw)

    subject = _decode_str(msg.get("Subject"))
    from_header = _decode_str(msg.get("From"))
    to_header = _decode_str(msg.get("To"))

    date_val: datetime | None = None
    if msg.get("Date"):
        try:
            date_val = parsedate_to_datetime(msg.get("Date"))
        except (TypeError, ValueError):
            date_val = None

    body_text, body_html, attachments, has_attachments = _extract_body_and_attachments(msg)
    snippet_source = body_text or (body_html or "")
    snippet = " ".join(snippet_source.split())[:200]

    flag_set = {f.decode() if isinstance(f, bytes) else f for f in flags}

    return MessageDetail(
        uid=uid,
        subject=subject or "(no subject)",
        sender_name=from_header,
        sender_address=from_header,
        recipients=[addr.strip() for addr in to_header.split(",")] if to_header else [],
        date=date_val,
        snippet=snippet,
        is_read="\\Seen" in flag_set,
        is_flagged="\\Flagged" in flag_set,
        has_attachments=has_attachments,
        ai_tags=[],
        ai_priority=None,
        ai_priority_score=None,
        body_text=body_text,
        body_html=body_html,
        attachments=attachments,
    )


def _sync_list_messages(account: EmailAccount, folder: str, limit: int, offset: int) -> MessageListResponse:
    conn = _connect(account)
    try:
        status, data = conn.select(f'"{folder}"', readonly=True)
        if status != "OK":
            raise ImapError(f"Could not open folder '{folder}'")
        total = int(data[0])

        status, search_data = conn.uid("search", None, "ALL")
        if status != "OK":
            raise ImapError("IMAP search failed")

        all_uids = search_data[0].split()
        all_uids.reverse()  # newest first (UIDs are monotonically increasing)
        page_uids = all_uids[offset : offset + limit]

        messages: list[MessageSummary] = []
        for uid_bytes in page_uids:
            uid = uid_bytes.decode()
            status, msg_data = conn.uid("fetch", uid, "(FLAGS RFC822)")
            if status != "OK" or not msg_data or msg_data[0] is None:
                continue
            raw = msg_data[0][1]
            flags = imaplib.ParseFlags(msg_data[0][0])
            detail = _parse_message(uid, raw, flags)
            messages.append(MessageSummary(**detail.model_dump(exclude={"body_text", "body_html", "attachments"})))

        return MessageListResponse(folder=folder, total=total, messages=messages)
    finally:
        try:
            conn.logout()
        except Exception:
            pass


def _sync_get_message(account: EmailAccount, folder: str, uid: str) -> MessageDetail:
    conn = _connect(account)
    try:
        status, _ = conn.select(f'"{folder}"', readonly=False)
        if status != "OK":
            raise ImapError(f"Could not open folder '{folder}'")

        status, msg_data = conn.uid("fetch", uid, "(FLAGS RFC822)")
        if status != "OK" or not msg_data or msg_data[0] is None:
            raise ImapError(f"Message {uid} not found in {folder}")

        raw = msg_data[0][1]
        flags = imaplib.ParseFlags(msg_data[0][0])
        return _parse_message(uid, raw, flags)
    finally:
        try:
            conn.logout()
        except Exception:
            pass


def _sync_set_flags(account: EmailAccount, folder: str, uid: str, is_read: bool | None, is_flagged: bool | None) -> None:
    conn = _connect(account)
    try:
        status, _ = conn.select(f'"{folder}"', readonly=False)
        if status != "OK":
            raise ImapError(f"Could not open folder '{folder}'")

        if is_read is not None:
            action = "+FLAGS" if is_read else "-FLAGS"
            conn.uid("store", uid, action, "(\\Seen)")
        if is_flagged is not None:
            action = "+FLAGS" if is_flagged else "-FLAGS"
            conn.uid("store", uid, action, "(\\Flagged)")
    finally:
        try:
            conn.logout()
        except Exception:
            pass


def _sync_test_connection(account: EmailAccount) -> tuple[bool, str | None]:
    try:
        conn = _connect(account)
        conn.logout()
        return True, None
    except ImapError as exc:
        return False, str(exc)


async def list_folders(account: EmailAccount) -> list[FolderOut]:
    return await asyncio.to_thread(_sync_list_folders, account)


async def list_messages(account: EmailAccount, folder: str, limit: int = 50, offset: int = 0) -> MessageListResponse:
    return await asyncio.to_thread(_sync_list_messages, account, folder, limit, offset)


async def get_message(account: EmailAccount, folder: str, uid: str) -> MessageDetail:
    return await asyncio.to_thread(_sync_get_message, account, folder, uid)


async def set_flags(
    account: EmailAccount, folder: str, uid: str, is_read: bool | None = None, is_flagged: bool | None = None
) -> None:
    await asyncio.to_thread(_sync_set_flags, account, folder, uid, is_read, is_flagged)


async def test_connection(account: EmailAccount) -> tuple[bool, str | None]:
    return await asyncio.to_thread(_sync_test_connection, account)
