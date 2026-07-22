from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import get_settings

settings = get_settings()

# NullPool: every request opens and closes its own connection rather than
# holding a long-lived pool. Required in serverless (Vercel functions are
# short-lived, stateless processes - a persistent pool would leak or go
# stale across invocations) and harmless for local dev. Use Neon's pooled
# ("-pooler") connection string in DATABASE_URL so Postgres itself (via
# PgBouncer) absorbs the connection churn this causes.
engine = create_async_engine(settings.database_url, echo=settings.debug, future=True, poolclass=NullPool)

AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
