"""
SUDARSHAN - Secure Unified Defense Architecture for Real-Time Sharing
         and High-level Authentication Network
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from db.database import init_db
from routers import auth, rooms, stream

# ─── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("sudarshan")


# ─── Lifespan ───────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🛡️  SUDARSHAN backend initialising …")
    await init_db()
    logger.info("✅  Database tables verified / created")
    yield
    logger.info("🔒  SUDARSHAN backend shutting down")


# ─── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SUDARSHAN",
    description=(
        "Secure Unified Defense Architecture for Real-Time Sharing "
        "and High-level Authentication Network"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ───────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ────────────────────────────────────────────────────────────────
app.include_router(auth.router,    prefix="/api/v1", tags=["Authentication"])
app.include_router(rooms.router,   prefix="/api/v1", tags=["Rooms"])
app.include_router(stream.router,  prefix="/api/v1", tags=["Stream Video"])


# ─── Health ─────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "system": "SUDARSHAN",
        "status": "operational",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
