"""
Room and RoomMember ORM models.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    passkey_hash: Mapped[str] = mapped_column(Text, nullable=False)  # SHA-256 hex
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relationships ────────────────────────────────────────────────────────
    creator  = relationship("User",       back_populates="rooms_created", lazy="select")
    members  = relationship("RoomMember", back_populates="room",          lazy="select", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Room id={self.id} name={self.name!r}>"


class RoomMember(Base):
    __tablename__ = "room_members"
    __table_args__ = (
        UniqueConstraint("user_id", "room_id", name="uq_room_member"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    room_id: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("rooms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relationships ────────────────────────────────────────────────────────
    user = relationship("User", back_populates="memberships", lazy="select")
    room = relationship("Room", back_populates="members",     lazy="select")

    def __repr__(self) -> str:
        return f"<RoomMember user={self.user_id} room={self.room_id}>"
