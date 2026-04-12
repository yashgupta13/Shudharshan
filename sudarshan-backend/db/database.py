"""
Synchronous SQLAlchemy engine, session factory, and DB initialisation.
"""

import logging
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import (
    Session,
    sessionmaker,
    DeclarativeBase,
)

from core.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""


# ─── Engine ─────────────────────────────────────────────────────────────────
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,          # detect stale connections
    pool_recycle=3600,           # recycle connections every hour
)

# ─── Session factory ────────────────────────────────────────────────────────
SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ─── FastAPI dependency ──────────────────────────────────────────────────────
def get_db() -> Generator[Session, None, None]:
    """Yield a database session and ensure it is closed after use."""
    with SessionLocal() as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()


# ─── Table initialisation ────────────────────────────────────────────────────
def init_db() -> None:
    """Create all tables if they don't exist (idempotent)."""
    # Import models so SQLAlchemy registers them with Base.metadata
    import models.user    # noqa: F401
    import models.room    # noqa: F401

    Base.metadata.create_all(bind=engine)
    logger.info("Database schema synchronised")
