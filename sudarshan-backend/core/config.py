"""
Application configuration – reads from environment / .env file.
"""

from functools import lru_cache
from typing import List

from pydantic import field_validator, Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ─────────────────────────────────────────────────────────────────
    APP_NAME: str = "SUDARSHAN"
    DEBUG: bool = False

    # ── Database ────────────────────────────────────────────────────────────
    DATABASE_URL: str = Field(
        validation_alias=AliasChoices("DATABASE_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING")
    )  # e.g. postgresql+asyncpg://user:pass@host/db

    # ── JWT ─────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── CORS ────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["*"]

    # ── Stream Video API ────────────────────────────────────────────────────
    STREAM_API_KEY: str
    STREAM_API_SECRET: str

    # ── Diffie-Hellman parameters (RFC-3526 MODP group 14 – 2048-bit) ──────
    # Single unbroken hex literal (no implicit string concatenation)
    DH_PRIME: int = 0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFF
    DH_GENERATOR: int = 2

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_db_url(cls, v: str) -> str:
        if not v:
            raise ValueError("DATABASE_URL must be set")
        # Standard postgresql driver is used for sync
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql://", 1)
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings: Settings = get_settings()
