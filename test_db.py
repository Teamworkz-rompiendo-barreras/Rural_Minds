
from sqlalchemy import create_engine
from sqlalchemy.engine import url

# Decoded URL
DB_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"

def test_connection():
    try:
        print(f"Connecting to: {DB_URL.split('@')[-1]} ...") # Hide password in logs
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            print("✅ Connection Successful!")
            result = conn.execute("SELECT 1")
            print(f"Result: {result.fetchone()}")
            
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    test_connection()
