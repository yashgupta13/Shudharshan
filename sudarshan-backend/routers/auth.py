"""
Authentication router – /signup, /login, /me
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user_id
from db.database import get_db
from schemas import SignupRequest, LoginRequest, TokenResponse, UserResponse
from services import user_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def signup(
    body: SignupRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await user_service.create_user(db, body)
        return user
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and receive a JWT",
)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        token = await user_service.authenticate_user(db, body.username, body.password)
        return token
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Return the currently authenticated user",
)
async def me(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
