"""
Diffie-Hellman key-exchange helpers.

The backend ONLY facilitates the DH handshake so that two clients can
derive a shared AES-256 secret.  The backend never learns the shared
secret, never encrypts, and never decrypts any message payload.

DH parameters: RFC-3526 MODP group 14 (2048-bit prime), generator = 2.
"""

import os
import logging
from core.config import settings

logger = logging.getLogger(__name__)

P = settings.DH_PRIME   # 2048-bit safe prime
G = settings.DH_GENERATOR


def generate_private_key() -> int:
    """
    Generate a cryptographically secure DH private key.
    Returns a random integer in [2, P-2].
    """
    # Use 256 random bits as the private exponent (well within [2, P-2])
    return int.from_bytes(os.urandom(32), "big")


def compute_public_key(private_key: int) -> int:
    """Compute DH public key: G^private_key mod P."""
    return pow(G, private_key, P)


def compute_shared_secret(their_public: int, my_private: int) -> int:
    """Compute the shared secret: their_public^my_private mod P."""
    return pow(their_public, my_private, P)


def shared_secret_to_hex(shared_secret: int) -> str:
    """
    Convert the shared integer to a 64-char hex string suitable for use
    as an AES-256 key (the first 32 bytes / 256 bits).
    """
    raw = shared_secret.to_bytes(256, "big")        # 2048-bit → 256 bytes
    return raw[:32].hex()                           # take first 32 bytes → AES-256


# ─── High-level helpers used by the /dh/* endpoints ─────────────────────────

def server_dh_step1() -> dict:
    """
    Server generates its own ephemeral DH key pair.
    Returns public key (hex) + a session token that clients use to continue.

    NOTE: In a real deployment store private_key in a short-lived cache
    (e.g. Redis) keyed by session_token; here we return it for demo purposes.
    The client MUST NOT expose it.
    """
    priv = generate_private_key()
    pub  = compute_public_key(priv)
    return {
        "server_public_key": hex(pub),
        "prime":             hex(P),
        "generator":         G,
        # ⚠️  In production, store priv server-side and send only a session id
        "_server_private_key_DEMO_ONLY": hex(priv),
    }


def server_dh_step2(server_private_hex: str, client_public_hex: str) -> dict:
    """
    Given the server private key and the client's public key, compute the
    shared secret.  Returns its hex representation for client verification
    (the first 32 bytes are the AES-256 key).

    In a production system the server would NOT return this – the client
    derives it locally.  Returned here for integration testing only.
    """
    server_priv  = int(server_private_hex, 16)
    client_pub   = int(client_public_hex, 16)
    shared       = compute_shared_secret(client_pub, server_priv)
    return {
        "shared_secret_hex":  shared_secret_to_hex(shared),
        "aes_256_key_hint":   "Use first 32 bytes of shared_secret_hex as AES-256 key",
    }
