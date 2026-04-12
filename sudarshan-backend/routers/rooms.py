"""
Rooms router – /create-room, /join-room, /rooms, /dh/*
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.dh import server_dh_step1, server_dh_step2
from core.security import get_current_user_id
from db.database import get_db
from schemas import (
    CreateRoomRequest,
    JoinRoomRequest,
    RoomResponse,
    RoomListResponse,
    DHPublicKeyResponse,
    DHCompleteRequest,
    DHCompleteResponse,
    MessageBase,
)
from services import room_service

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Room management ─────────────────────────────────────────────────────────

@router.post(
    "/create-room",
    response_model=RoomResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new private room",
)
def create_room(
    body: CreateRoomRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    try:
        room = room_service.create_room(db, body, user_id)
        return room
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post(
    "/join-room",
    response_model=RoomResponse,
    summary="Join a room using its passkey",
)
def join_room(
    body: JoinRoomRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    try:
        room = room_service.join_room(db, body, user_id)
        return room
    except ValueError as exc:
        code = (
            status.HTTP_404_NOT_FOUND
            if "not found" in str(exc).lower()
            else status.HTTP_403_FORBIDDEN
        )
        raise HTTPException(status_code=code, detail=str(exc))


@router.get(
    "/rooms",
    response_model=RoomListResponse,
    summary="List all rooms the current user belongs to",
)
def list_rooms(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    rooms = room_service.get_user_rooms(db, user_id)
    return RoomListResponse(rooms=rooms, total=len(rooms))


# ─── Diffie-Hellman endpoints ─────────────────────────────────────────────────

@router.get(
    "/dh/init",
    response_model=DHPublicKeyResponse,
    summary="Step 1 – Server DH public key + parameters",
    description=(
        "Client calls this to obtain the server's ephemeral DH public key "
        "and the shared group parameters (prime P, generator G). "
        "The client then generates its own private/public key pair locally."
    ),
)
def dh_init(_: str = Depends(get_current_user_id)):
    data = server_dh_step1()
    return DHPublicKeyResponse(
        server_public_key=data["server_public_key"],
        prime=data["prime"],
        generator=data["generator"],
    )


@router.post(
    "/dh/complete",
    response_model=DHCompleteResponse,
    summary="Step 2 – Derive shared AES-256 key (demo)",
    description=(
        "**Demo only** – in production the shared secret is derived client-side. "
        "Send the server's private key (from /dh/init response) plus your own "
        "public key to get back the shared secret hex. "
        "The first 32 bytes form the AES-256 key used to encrypt messages."
    ),
)
def dh_complete(
    body: DHCompleteRequest,
    _: str = Depends(get_current_user_id),
):
    result = server_dh_step2(body.server_private_key, body.client_public_key)
    return DHCompleteResponse(**result)
