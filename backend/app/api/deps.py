from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.account import EmailAccount


async def get_account_or_404(account_id: str, db: AsyncSession = Depends(get_db)) -> EmailAccount:
    account = await db.get(EmailAccount, account_id)
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email account not found")
    return account
