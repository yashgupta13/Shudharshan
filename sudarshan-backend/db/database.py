"""
Async SQLAlchemy engine, session factory, and DB initialisation.
"""

import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from core.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""


# ─── Engine ─────────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,          # detect stale connections
    pool_recycle=3600,           # recycle connections every hour
)

# ─── Session factory ────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ─── FastAPI dependency ──────────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session and ensure it is closed after use."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ─── Table initialisation ────────────────────────────────────────────────────
async def init_db() -> None:
    """Create all tables if they don't exist (idempotent)."""
    # Import models so SQLAlchemy registers them with Base.metadata
    import models.user    # noqa: F401
    import models.room    # noqa: F401
    import models.message # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema synchronised")
