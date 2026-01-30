import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env file
load_dotenv()

# Use environment variable for database URL (Supabase PostgreSQL)
# Fallback to SQLite for local development
# TEMPORARY HARDCODED FOR DEBUGGING CONNECTIVITY
DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!%23@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"
# DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./teamworkz.db")

# Handle PostgreSQL specific connection args
# Handle PostgreSQL specific connection args
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if "postgresql" in DATABASE_URL:
    if "sslmode" not in DATABASE_URL:
        # Append sslmode=require for secure connections (Supabase/Vercel)
        separator = "&" if "?" in DATABASE_URL else "?"
        DATABASE_URL = f"{DATABASE_URL}{separator}sslmode=require"
    engine = create_engine(DATABASE_URL)
else:
    # SQLite needs check_same_thread=False
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
