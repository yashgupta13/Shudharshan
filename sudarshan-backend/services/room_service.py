"""
Room service layer.
"""

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import hash_passkey, verify_passkey
from models.room import Room, RoomMember
from schemas import CreateRoomRequest, JoinRoomRequest
from services import stream_service

logger = logging.getLogger(__name__)


async def create_room(
    db: AsyncSession, data: CreateRoomRequest, creator_id: str
) -> Room:
    """
    Create a new private room.
    Passkey is hashed with SHA-256 before persistence.
    """
    creator_uuid = uuid.UUID(creator_id)
    room = Room(
        id=uuid.uuid4(),
        room_name=data.room_name,
        passkey_hash=hash_passkey(data.passkey),   # SHA-256 – plain passkey never stored
        created_by=creator_uuid,
    )
    db.add(room)
    await db.flush()

    # Creator automatically becomes a member
    membership = RoomMember(user_id=creator_uuid, room_id=room.id)
    db.add(membership)
    await db.refresh(room)

    # Automatically create Stream messaging channel with creator as member
    stream_service.create_channel(str(room.id), creator_id, room.room_name)

    logger.info("Room created: %s by user %s", room.room_name, creator_id)
    return room


async def join_room(
    db: AsyncSession, data: JoinRoomRequest, user_id: str
) -> Room:
    """
    Validate passkey and add user to room.
    Raises ValueError on invalid room or passkey.
    """
    # Fetch room
    stmt = select(Room).where(Room.id == data.room_id)
    room = (await db.execute(stmt)).scalar_one_or_none()
    if not room:
        raise ValueError("Room not found")

    # Verify passkey
    if not verify_passkey(data.passkey, room.passkey_hash):
        raise ValueError("Invalid passkey")

    user_uuid = uuid.UUID(user_id)

    # Check if already a member
    stmt_m = select(RoomMember).where(
        RoomMember.user_id == user_uuid,
        RoomMember.room_id == room.id,
    )
    existing = (await db.execute(stmt_m)).scalar_one_or_none()
    if existing:
        logger.info("User %s re-joined room %s", user_id, room.id)
        return room

    membership = RoomMember(user_id=user_uuid, room_id=room.id)
    db.add(membership)
    await db.flush()

    # Automatically add new member to the Stream channel
    stream_service.add_member_to_channel(str(room.id), user_id)

    logger.info("User %s joined room %s", user_id, room.id)
    return room


async def get_user_rooms(db: AsyncSession, user_id: str) -> list[Room]:
    """Return all rooms the user is a member of."""
    user_uuid = uuid.UUID(user_id)
    stmt = (
        select(Room)
        .join(RoomMember, RoomMember.room_id == Room.id)
        .where(RoomMember.user_id == user_uuid)
        .order_by(Room.created_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def is_room_member(db: AsyncSession, room_id: uuid.UUID, user_id: str) -> bool:
    """Return True if user is a member of the given room."""
    user_uuid = uuid.UUID(user_id)
    stmt = select(RoomMember).where(
        RoomMember.room_id == room_id,
        RoomMember.user_id == user_uuid,
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None
