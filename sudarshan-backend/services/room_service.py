"""
Room service layer.
"""

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.security import hash_passkey, verify_passkey
from models.room import Room, RoomMember
from schemas import CreateRoomRequest, JoinRoomRequest
from services import stream_service

logger = logging.getLogger(__name__)


def create_room(
    db: Session, data: CreateRoomRequest, creator_id: str
) -> Room:
    """
    Create a new private room using the provided room_id and name.
    """
    creator_uuid = uuid.UUID(creator_id)
    room = Room(
        id=data.room_id,
        name=data.name,
        description=data.description,
        passkey_hash=data.passkey_hash,
        created_by=creator_uuid,
    )
    db.add(room)
    db.flush()

    # Creator automatically becomes a member
    membership = RoomMember(user_id=creator_uuid, room_id=room.id)
    db.add(membership)
    db.refresh(room)

    # Automatically create Stream messaging channel with creator as member
    stream_service.create_channel(room.id, creator_id, room.name)

    logger.info("Room created: %s (%s) by user %s", room.name, room.id, creator_id)
    return room


def join_room(
    db: Session, data: JoinRoomRequest, user_id: str
) -> Room:
    """
    Validate passkey_hash and add user to room.
    Raises ValueError on invalid room or passkey.
    """
    # Fetch room
    stmt = select(Room).where(Room.id == data.room_id)
    room = db.execute(stmt).scalar_one_or_none()
    if not room:
        raise ValueError("Room not found")

    # Verify passkey_hash (direct comparison as it's pre-hashed)
    if room.passkey_hash != data.passkey_hash:
        raise ValueError("Invalid passkey")

    user_uuid = uuid.UUID(user_id)

    # Check if already a member
    stmt_m = select(RoomMember).where(
        RoomMember.user_id == user_uuid,
        RoomMember.room_id == room.id,
    )
    existing = db.execute(stmt_m).scalar_one_or_none()
    if existing:
        logger.info("User %s re-joined room %s", user_id, room.id)
        return room

    membership = RoomMember(user_id=user_uuid, room_id=room.id)
    db.add(membership)
    db.flush()

    # Automatically add new member to the Stream channel
    stream_service.add_member_to_channel(room.id, user_id)

    logger.info("User %s joined room %s", user_id, room.id)
    return room


def get_user_rooms(db: Session, user_id: str) -> list[Room]:
    """Return all rooms the user is a member of."""
    user_uuid = uuid.UUID(user_id)
    stmt = (
        select(Room)
        .join(RoomMember, RoomMember.room_id == Room.id)
        .where(RoomMember.user_id == user_uuid)
        .order_by(Room.created_at.desc())
    )
    result = db.execute(stmt)
    return list(result.scalars().all())


def is_room_member(db: Session, room_id: str, user_id: str) -> bool:
    """Return True if user is a member of the given room."""
    user_uuid = uuid.UUID(user_id)
    stmt = select(RoomMember).where(
        RoomMember.room_id == room_id,
        RoomMember.user_id == user_uuid,
    )
    result = db.execute(stmt)
    return result.scalar_one_or_none() is not None
