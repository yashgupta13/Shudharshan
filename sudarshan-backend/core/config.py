"""
Application configuration – reads from environment / .env file.
"""

import urllib.parse
from functools import lru_cache
from typing import List, Optional

from pydantic import field_validator, Field, AliasChoices, model_validator
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
    # Unified URL (Vercel style)
    DATABASE_URL: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("DATABASE_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING", "POSTGRES_PRISMA_URL")
    )

    # Individual components (Supabase style) - fallback if URL is not provided
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_HOST: Optional[str] = None
    POSTGRES_PORT: int = 5432
    POSTGRES_DATABASE: str = "postgres"

    @model_validator(mode="after")
    def assemble_db_url(self) -> "Settings":
        """
        If DATABASE_URL is not provided via env, construct it from individual components.
        """
        if not self.DATABASE_URL:
            if not self.POSTGRES_HOST:
                # If neither URL nor HOST is provided, we can't connect
                return self
            
            # Sanitise and encode components
            host = self.POSTGRES_HOST.strip()
            user = urllib.parse.quote_plus(self.POSTGRES_USER.strip())
            db_name = self.POSTGRES_DATABASE.strip()
            
            user_part = user
            if self.POSTGRES_PASSWORD:
                password = urllib.parse.quote_plus(self.POSTGRES_PASSWORD.strip())
                user_part += f":{password}"
            
            self.DATABASE_URL = (
                f"postgresql://{user_part}@{host}:"
                f"{self.POSTGRES_PORT}/{db_name}"
            )
        
        # Finally, sanitize the URL regardless of source
        self.DATABASE_URL = self.sanitize_db_url(self.DATABASE_URL)
        return self

    @classmethod
    def sanitize_db_url(cls, v: str) -> str:
        """Helper to sanitize common connection string inconsistencies."""
        v = v.strip()
        # Standard postgresql driver is used for sync
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql://", 1)
        # Ensure we don't try to use the asyncpg dialect even if it's passed in
        if "postgresql+asyncpg://" in v:
            v = v.replace("postgresql+asyncpg://", "postgresql://")
        return v

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



@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings: Settings = get_settings()
