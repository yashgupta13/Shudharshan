"""
User / authentication service layer.
"""

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.config import settings
from core.security import hash_password, verify_password, create_access_token
from models.user import User
from schemas import SignupRequest, TokenResponse
from services import stream_service

logger = logging.getLogger(__name__)


def create_user(db: Session, data: SignupRequest) -> User:
    """
    Register a new user.
    Raises ValueError if username/email already exists.
    """
    # Check uniqueness
    stmt = select(User).where(
        (User.username == data.username) | (User.email == data.email)
    )
    existing = db.execute(stmt).scalar_one_or_none()
    if existing:
        if existing.username == data.username:
            raise ValueError("Username already taken")
        raise ValueError("Email already registered")

    user = User(
        id=uuid.uuid4(),
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.flush()          # get the generated id without committing
    db.refresh(user)

    # Sync user with Stream
    stream_service.sync_user(str(user.id), user.username)

    logger.info("New user registered: %s", user.username)
    return user


def authenticate_user(
    db: Session, username: str, password: str
) -> TokenResponse:
    """
    Verify credentials and return a JWT access token.
    Raises ValueError on invalid credentials.
    """
    stmt = select(User).where(User.username == username, User.is_active == True)
    user = db.execute(stmt).scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise ValueError("Invalid username or password")

    # Sync user with Stream on login
    stream_service.sync_user(str(user.id), user.username)

    token = create_access_token(subject=str(user.id), extra={"username": user.username})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def get_user_by_id(db: Session, user_id: str) -> User | None:
    """Return a User by UUID string, or None."""
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        return None
    stmt = select(User).where(User.id == uid, User.is_active == True)
    return db.execute(stmt).scalar_one_or_none()
