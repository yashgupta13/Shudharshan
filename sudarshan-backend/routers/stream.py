"""
Stream Video router – /token
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.security import get_current_user_id
from db.database import get_db
from schemas import StreamTokenResponse
from services import stream_service, user_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get(
    "/stream/token/{user_id}",
    summary="Generate a Stream Video token for the authenticated user",
    response_model=StreamTokenResponse
)
def get_stream_token(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Returns a Stream token for the requested user, if they are authenticated.
    """
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to get token for this user"
        )
    # Fetch user to get username for syncing
    user = user_service.get_user_by_id(db, user_id)
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
        
        return StreamTokenResponse(
            token=token,
            user_id=user_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )
