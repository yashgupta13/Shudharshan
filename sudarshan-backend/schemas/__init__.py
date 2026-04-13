"""
Pydantic v2 schemas – request bodies and response models.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── Shared ──────────────────────────────────────────────────────────────────

class MessageBase(BaseModel):
    """Returned in HTTP responses for error / info messages."""
    message: str


# ─── Auth ────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user_id: str


class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Rooms ───────────────────────────────────────────────────────────────────

class CreateRoomRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    room_id: str = Field(..., description="Friendly room ID (XXXX-XXXX)")
    passkey_hash: str = Field(..., description="SHA-256 hashed passkey from client")


class JoinRoomRequest(BaseModel):
    room_id: str = Field(..., description="Friendly room ID (XXXX-XXXX)")
    passkey_hash: str = Field(..., description="SHA-256 hashed passkey from client")


class RoomResponse(BaseModel):
    id: uuid.UUID
    name: str
    room_id: Optional[str] = None  # Friendly ID
    description: Optional[str] = None
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class RoomListResponse(BaseModel):
    rooms: list[RoomResponse]
    total: int



# ─── Diffie-Hellman ──────────────────────────────────────────────────────────

class DHPublicKeyResponse(BaseModel):
    server_public_key: str  # hex
    prime: str              # hex
    generator: int


class DHCompleteRequest(BaseModel):
    client_public_key: str  # hex
    server_private_key: str # hex (demo; in prod use a session id)


class DHCompleteResponse(BaseModel):
    shared_secret_hex: str
    aes_256_key_hint: str


# ─── Stream API ──────────────────────────────────────────────────────────────

class StreamTokenResponse(BaseModel):
    token: str
    user_id: str
