import os
import uuid
import bcrypt
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Setup minimal logging
logging.basicConfig(level=logging.INFO)

# Hardcoded fallback using the provided Supabase URL
# (The &supa=base-pooler.x parameter is removed to prevent psycopg2 error)
DATABASE_URL = "postgresql://postgres.zxajgeegmcyduurfwqvp:H2sKUKdhLbEF4Bo4@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def generate_hash(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt).decode()

def seed_users():
    session = SessionLocal()
    try:
        users_to_create = [
            {
                "id": str(uuid.uuid4()),
                "username": "user1",
                "email": "user1@gmail.com",
                "password_hash": generate_hash("User1@123"),
            },
            {
                "id": str(uuid.uuid4()),
                "username": "user2",
                "email": "user2@gmail.com",
                "password_hash": generate_hash("User2@123"),
            }
        ]

        for u in users_to_create:
            session.execute(
                text("""
                INSERT INTO users (id, username, email, password_hash, is_active, created_at)
                VALUES (:id, :username, :email, :password_hash, true, NOW())
                ON CONFLICT (username) DO NOTHING;
                """),
                u
            )
        
        session.commit()
        logging.info("✅ Successfully created 2 test users (user1 & user2)")
        
    except Exception as e:
        session.rollback()
        logging.error(f"❌ Failed to seed users: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    seed_users()

