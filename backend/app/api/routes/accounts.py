from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_account_or_404
from app.core.security import encrypt_secret
from app.db.database import get_db
from app.models.account import EmailAccount
from app.schemas.account import (
    ConnectionTestRequest,
    ConnectionTestResult,
    EmailAccountCreate,
    EmailAccountOut,
    EmailAccountUpdate,
)
from app.services import imap_service, smtp_service

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=list[EmailAccountOut])
async def list_accounts(db: AsyncSession = Depends(get_db)) -> list[EmailAccount]:
    result = await db.execute(select(EmailAccount).order_by(EmailAccount.created_at))
    return list(result.scalars().all())


@router.post("", response_model=EmailAccountOut, status_code=status.HTTP_201_CREATED)
async def create_account(payload: EmailAccountCreate, db: AsyncSession = Depends(get_db)) -> EmailAccount:
    if payload.is_default:
        await _clear_existing_default(db)

    account = EmailAccount(
        label=payload.label,
        email_address=payload.email_address,
        profile=payload.profile,
        color=payload.color,
        is_default=payload.is_default,
        imap_host=payload.imap_host,
        imap_port=payload.imap_port,
        imap_use_ssl=payload.imap_use_ssl,
        imap_username=payload.imap_username,
        imap_password_encrypted=encrypt_secret(payload.imap_password),
        smtp_host=payload.smtp_host,
        smtp_port=payload.smtp_port,
        smtp_use_tls=payload.smtp_use_tls,
        smtp_username=payload.smtp_username,
        smtp_password_encrypted=encrypt_secret(payload.smtp_password),
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


@router.post("/test-connection", response_model=ConnectionTestResult)
async def test_connection_before_save(payload: ConnectionTestRequest) -> ConnectionTestResult:
    """Tests IMAP/SMTP credentials without persisting anything - lets the Add
    Account form verify a login works before the user commits to saving it.
    """
    probe = EmailAccount(
        imap_host=payload.imap_host,
        imap_port=payload.imap_port,
        imap_use_ssl=payload.imap_use_ssl,
        imap_username=payload.imap_username,
        imap_password_encrypted=encrypt_secret(payload.imap_password),
        smtp_host=payload.smtp_host,
        smtp_port=payload.smtp_port,
        smtp_use_tls=payload.smtp_use_tls,
        smtp_username=payload.smtp_username,
        smtp_password_encrypted=encrypt_secret(payload.smtp_password),
    )
    imap_ok, imap_error = await imap_service.test_connection(probe)
    smtp_ok, smtp_error = await smtp_service.test_connection(probe)
    return ConnectionTestResult(imap_ok=imap_ok, smtp_ok=smtp_ok, imap_error=imap_error, smtp_error=smtp_error)


@router.get("/{account_id}", response_model=EmailAccountOut)
async def get_account(account: EmailAccount = Depends(get_account_or_404)) -> EmailAccount:
    return account


@router.patch("/{account_id}", response_model=EmailAccountOut)
async def update_account(
    payload: EmailAccountUpdate,
    account: EmailAccount = Depends(get_account_or_404),
    db: AsyncSession = Depends(get_db),
) -> EmailAccount:
    data = payload.model_dump(exclude_unset=True)

    if data.get("is_default"):
        await _clear_existing_default(db, exclude_id=account.id)

    if "imap_password" in data:
        password = data.pop("imap_password")
        account.imap_password_encrypted = encrypt_secret(password)
    if "smtp_password" in data:
        password = data.pop("smtp_password")
        account.smtp_password_encrypted = encrypt_secret(password)

    for field, value in data.items():
        setattr(account, field, value)

    await db.commit()
    await db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account: EmailAccount = Depends(get_account_or_404), db: AsyncSession = Depends(get_db)
) -> None:
    await db.delete(account)
    await db.commit()


@router.post("/{account_id}/test-connection", response_model=ConnectionTestResult)
async def test_connection(account: EmailAccount = Depends(get_account_or_404)) -> ConnectionTestResult:
    imap_ok, imap_error = await imap_service.test_connection(account)
    smtp_ok, smtp_error = await smtp_service.test_connection(account)
    return ConnectionTestResult(imap_ok=imap_ok, smtp_ok=smtp_ok, imap_error=imap_error, smtp_error=smtp_error)


async def _clear_existing_default(db: AsyncSession, exclude_id: str | None = None) -> None:
    result = await db.execute(select(EmailAccount).where(EmailAccount.is_default.is_(True)))
    for existing in result.scalars().all():
        if existing.id == exclude_id:
            continue
        existing.is_default = False
