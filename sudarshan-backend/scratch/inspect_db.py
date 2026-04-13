
import os
import re
from sqlalchemy import create_engine, inspect

def get_db_url():
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            content = f.read()
            # Look for DATABASE_URL=... (handle commented out for now)
            # Actually, if it's commented out in .env, maybe it's passed via system env.
            # But let's look for any variant.
            match = re.search(r"^DATABASE_URL=(.+)$", content, re.M)
            if match:
                return match.group(1).strip()
    return os.getenv("DATABASE_URL")

def check_schema():
    url = get_db_url()
    if not url:
        # Try to find the Supabase one that's commented out as a fallback for the pattern
        with open(".env", "r") as f:
            content = f.read()
            match = re.search(r"^#\s*DATABASE_URL=(.+)$", content, re.M)
            if match:
                url = match.group(1).strip()
    
    if not url:
        print("DATABASE_URL not found")
        return

    # Replace asynchronous driver if present for simple sync inspection
    if "+asyncpg" in url:
        url = url.replace("+asyncpg", "")

    try:
        engine = create_engine(url)
        inspector = inspect(engine)
        columns = inspector.get_columns('rooms')
        print("Columns in 'rooms' table:")
        for column in columns:
            print(f"- {column['name']} ({column['type']})")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
