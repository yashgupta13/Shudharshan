"""
Stream Video router – /token
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user_id
from db.database import get_db
from core.config import settings
from services import stream_service, user_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get(
    "/stream/token",
    summary="Generate a Stream Video token for the authenticated user",
)
async def get_stream_token(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns a Stream Video token and the API key.
    Syncs the user's username with Stream before generating the token.
    """
    # Fetch user to get username for syncing
    user = await user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    try:
        # Generate token and sync user
        token = stream_service.get_user_token(
            user_id=str(user.id),
            username=user.username
        )
        
        return {
            "token": token,
            "api_key": settings.STREAM_API_KEY,
            "user_id": str(user.id),
            "username": user.username
        }
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )
