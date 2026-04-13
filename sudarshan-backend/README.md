# 🛡️ SUDARSHAN

**Secure Unified Defense Architecture for Real-Time Sharing and High-level Authentication Network**

A production-ready, end-to-end-encrypted real-time chat backend built with FastAPI, PostgreSQL (Supabase), and WebSockets.

---

## ✨ Feature Overview

| Feature | Implementation |
|---|---|
| Authentication | JWT (HS256) + bcrypt password hashing |
| Passkey protection | SHA-256 hashing before DB storage |
| Real-time messaging | FastAPI native WebSockets |
| End-to-end encryption | Diffie-Hellman key exchange + AES-256 (client-side) |
| Database | PostgreSQL via Supabase + async SQLAlchemy |
| Deployment | Render / Railway ready |

---

## 📁 Project Structure

```
sudarshan/
├── main.py                  # FastAPI app, CORS, lifespan
├── requirements.txt
├── Procfile                 # Render / Railway start command
├── render.yaml              # Render deployment config
├── .env.example             # Environment variable template
│
├── core/
│   ├── config.py            # Pydantic-settings configuration
│   ├── security.py          # bcrypt, SHA-256, JWT helpers
│   └── dh.py                # Diffie-Hellman key exchange logic
│
├── db/
│   └── database.py          # Async SQLAlchemy engine + session factory
│
├── models/
│   ├── user.py              # Users table ORM model
│   ├── room.py              # Rooms + RoomMembers table ORM models
│   └── message.py           # Messages table ORM model
│
├── schemas/
│   └── __init__.py          # All Pydantic v2 request / response schemas
│
├── services/
│   ├── user_service.py      # Signup, login, user lookup
│   ├── room_service.py      # Create room, join room, list rooms
│   └── message_service.py   # Store + retrieve encrypted messages
│
├── routers/
│   ├── auth.py              # POST /signup, /login, GET /me
│   ├── rooms.py             # POST /create-room, /join-room, GET /rooms, DH endpoints
│   └── messages.py          # GET /rooms/{id}/messages, WS /ws/{room_id}
│
└── websocket/
    └── manager.py           # In-memory connection manager + broadcaster
```

---

## 🚀 Local Setup

### 1. Prerequisites

- Python ≥ 3.11
- A [Supabase](https://supabase.com) project (free tier works fine)

### 2. Clone and install

```bash
git clone <your-repo-url>
cd sudarshan

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:<password>@db.<ref>.supabase.co:5432/postgres
JWT_SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(64))">
```

> **Supabase tip:** Go to *Project Settings → Database → Connection string → URI*.  
> Replace `postgresql://` with `postgresql+asyncpg://`.

### 4. Run

```bash
uvicorn main:app --reload --port 8000
```

Tables are created automatically on first startup.

- API docs: http://localhost:8000/docs  
- ReDoc:    http://localhost:8000/redoc

---

## 🌐 API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/signup` | – | Register new user |
| POST | `/api/v1/login` | – | Login → JWT |
| GET | `/api/v1/me` | ✅ | Current user profile |

**Signup body:**
```json
{ "username": "alice", "email": "alice@example.com", "password": "Secret123" }
```

**Login body:**
```json
{ "username": "alice", "password": "Secret123" }
```

**Login response:**
```json
{ "access_token": "<jwt>", "token_type": "bearer", "expires_in": 3600 }
```

---

### Rooms

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/create-room` | ✅ | Create a private room |
| POST | `/api/v1/join-room` | ✅ | Join using passkey |
| GET | `/api/v1/rooms` | ✅ | List your rooms |
| GET | `/api/v1/dh/init` | ✅ | DH Step 1 – server public key |
| POST | `/api/v1/dh/complete` | ✅ | DH Step 2 – derive shared secret |

**Create room body:**
```json
{ "name": "Ops Team", "passkey": "super-secret-phrase" }
```

**Join room body:**
```json
{ "room_id": "<uuid>", "passkey": "super-secret-phrase" }
```

---

### Messages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/rooms/{room_id}/messages` | ✅ JWT | Paginated message history |
| WS | `/api/v1/ws/{room_id}?token=<jwt>` | ✅ JWT | Real-time chat |

**Query params for GET messages:** `limit` (1–200, default 50), `offset` (default 0)

---

## 🔌 WebSocket Protocol

Connect:
```
ws://localhost:8000/api/v1/ws/<room_id>?token=<jwt>
```

**Client → Server frames:**
```jsonc
// Send an encrypted message
{ "type": "message", "encrypted_payload": "<AES-256 base64 ciphertext>" }

// Keep-alive
{ "type": "ping" }
```

**Server → Client frames:**
```jsonc
// On your own connect
{ "type": "joined", "sender_username": "alice", "user_count": 3 }

// Broadcast message
{ "type": "message", "sender_id": "...", "sender_username": "alice",
  "encrypted_payload": "...", "message_id": "...", "timestamp": "..." }

// Someone joined / left
{ "type": "user_joined", "sender_username": "bob", "user_count": 4 }
{ "type": "user_left",   "sender_username": "bob", "user_count": 3 }

// Ping response
{ "type": "pong" }

// Error
{ "type": "error", "detail": "..." }
```

---

## 🔒 End-to-End Encryption Flow

```
Alice                         Server                          Bob
  |                              |                              |
  |--- GET /dh/init ----------->|                              |
  |<-- server_pub, P, G --------|                              |
  |                              |                              |
  | generate alice_priv, alice_pub = G^alice_priv mod P        |
  |                              |                              |
  |--- POST /dh/complete ------->|  (demo: derive shared secret)|
  |<-- shared_secret_hex --------|                              |
  |                              |                              |
  | AES-256 key = shared_secret_hex[:32]                       |
  | ciphertext = AES-256-GCM(key, plaintext)                   |
  |                              |                              |
  |=== WS: { type:"message",    |                              |
  |    encrypted_payload: cipher }->  store(cipher) -> broadcast|
  |                              |--- { encrypted_payload } --->|
  |                              |       Bob decrypts locally   |
```

> The server stores and forwards **only ciphertext**. It never has access to the AES key or plaintext.

---

## 🚢 Deploy to Render

1. Push code to GitHub.
2. On [Render](https://render.com), create a **New Web Service** → connect your repo.
3. Set environment variables in the Render dashboard:
   - `DATABASE_URL` → your Supabase connection string
   - `JWT_SECRET_KEY` → random 64-char hex
4. Render auto-detects `render.yaml` and builds from `requirements.txt`.

## 🚂 Deploy to Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. `railway login && railway init`
3. Set variables: `railway variables set DATABASE_URL=... JWT_SECRET_KEY=...`
4. `railway up`

---

## 🔐 Security Notes

- **Passwords** are hashed with bcrypt (cost factor 12). Plaintext is never stored.
- **Passkeys** are hashed with SHA-256 before storage. The hash cannot be reversed.
- **JWT** tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60 min). Use HTTPS in production to prevent token interception.
- **Messages** are stored as opaque ciphertext. The server has zero knowledge of plaintext content.
- **DH `/dh/complete`** is a development helper. In production, the client derives the shared secret locally — the server need not (and should not) be involved.
- **WebSocket auth** uses a query-string token; always serve over `wss://` in production.
- For **multi-process / multi-node** deployments replace the in-memory `ConnectionManager` with Redis Pub/Sub.

---

## 📄 License

MIT
