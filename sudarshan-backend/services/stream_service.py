"""
Stream API service layer (Chat).
"""

import logging
from typing import Optional
from stream_chat import StreamChat

from core.config import settings

logger = logging.getLogger(__name__)

# Initialize Stream Clients
chat_client = StreamChat(
    api_key=settings.STREAM_API_KEY,
    api_secret=settings.STREAM_API_SECRET,
)


def sync_user(user_id: str, username: str) -> None:
    """
    Upserts the user into Stream (Chat and Video share the same underlying user base).
    """
    try:
        chat_client.upsert_user({
            "id": user_id,
            "name": username,
            "role": "user",
        })
        logger.info(f"Synced user {user_id} ({username}) to Stream")
    except Exception as e:
        logger.error(f"Error syncing user {user_id} to Stream: {str(e)}")
        raise ValueError(f"Stream user sync failed: {str(e)}")

def get_user_token(user_id: str, username: Optional[str] = None) -> str:
    """
    Generate a unified Stream token for a user.
    Optionally syncs the user if username is provided.
    """
    if username:
        sync_user(user_id, username)
        
    try:
        # Generate Token (valid for both chat and video)
        token = chat_client.create_token(user_id)
        return token
    except Exception as e:
        logger.error(f"Error generating Stream token for {user_id}: {str(e)}")
        raise ValueError(f"Stream token generation failed: {str(e)}")

def create_channel(room_id: str, creator_id: str, name: str) -> None:
    """
    Creates a Stream messaging channel for the given room.
    """
    try:
        channel = chat_client.channel("messaging", room_id)
        channel.create(creator_id, {"name": name})
        logger.info(f"Created Stream channel for room {room_id}")
    except Exception as e:
        logger.error(f"Error creating Stream channel {room_id}: {str(e)}")
        raise ValueError(f"Stream channel creation failed: {str(e)}")

def add_member_to_channel(room_id: str, user_id: str) -> None:
    """
    Adds a user as a member to an existing Stream channel.
    """
    try:
        channel = chat_client.channel("messaging", room_id)
        channel.add_members([user_id])
        logger.info(f"Added member {user_id} to Stream channel {room_id}")
    except Exception as e:
        logger.error(f"Error adding member {user_id} to Stream channel {room_id}: {str(e)}")
        raise ValueError(f"Stream member addition failed: {str(e)}")
