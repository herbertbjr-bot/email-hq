from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_account_or_404
from app.models.account import EmailAccount
from app.schemas.email import (
    FolderOut,
    MessageDetail,
    MessageFlagUpdate,
    MessageListResponse,
    MessageMoveRequest,
    SendMessageRequest,
)
from app.services import imap_service, smtp_service
from app.services.imap_service import ImapError, MessageQuery
from app.services.smtp_service import SmtpError

router = APIRouter(prefix="/accounts/{account_id}/mail", tags=["mail"])


@router.get("/folders", response_model=list[FolderOut])
async def list_folders(account: EmailAccount = Depends(get_account_or_404)) -> list[FolderOut]:
    try:
        return await imap_service.list_folders(account)
    except ImapError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/folders/{folder}/messages", response_model=MessageListResponse)
async def list_messages(
    folder: str,
    account: EmailAccount = Depends(get_account_or_404),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(default=None, max_length=200, description="Full-text search (subject/from/to/body)"),
    subject: str | None = Query(default=None, max_length=200),
    from_address: str | None = Query(default=None, max_length=200),
    to_address: str | None = Query(default=None, max_length=200),
    date_from: date | None = Query(default=None, description="Only messages on/after this date"),
    date_to: date | None = Query(default=None, description="Only messages before this date"),
    unread_only: bool = Query(default=False),
    flagged_only: bool = Query(default=False),
    sort: Literal["date_desc", "date_asc"] = Query(default="date_desc"),
) -> MessageListResponse:
    query = MessageQuery(
        text=q,
        subject=subject,
        from_address=from_address,
        to_address=to_address,
        unread_only=unread_only,
        flagged_only=flagged_only,
        date_from=date_from,
        date_to=date_to,
        sort=sort,
    )
    try:
        return await imap_service.list_messages(account, folder, limit=limit, offset=offset, query=query)
    except ImapError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/folders/{folder}/messages/{uid}", response_model=MessageDetail)
async def get_message(
    folder: str, uid: str, account: EmailAccount = Depends(get_account_or_404)
) -> MessageDetail:
    try:
        return await imap_service.get_message(account, folder, uid)
    except ImapError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/folders/{folder}/messages/{uid}/flags", status_code=status.HTTP_204_NO_CONTENT)
async def update_flags(
    folder: str,
    uid: str,
    payload: MessageFlagUpdate,
    account: EmailAccount = Depends(get_account_or_404),
) -> None:
    try:
        await imap_service.set_flags(account, folder, uid, is_read=payload.is_read, is_flagged=payload.is_flagged)
    except ImapError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.post("/folders/{folder}/messages/{uid}/move", status_code=status.HTTP_204_NO_CONTENT)
async def move_message(
    folder: str,
    uid: str,
    payload: MessageMoveRequest,
    account: EmailAccount = Depends(get_account_or_404),
) -> None:
    try:
        await imap_service.move_message(account, folder, uid, payload.target_folder)
    except ImapError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.delete("/folders/{folder}/messages/{uid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    folder: str,
    uid: str,
    account: EmailAccount = Depends(get_account_or_404),
) -> None:
    try:
        await imap_service.delete_message(account, folder, uid)
    except ImapError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.post("/send", status_code=status.HTTP_202_ACCEPTED)
async def send_message(
    payload: SendMessageRequest, account: EmailAccount = Depends(get_account_or_404)
) -> dict[str, str]:
    try:
        await smtp_service.send_message(account, payload)
    except SmtpError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return {"status": "sent"}
