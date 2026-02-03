
import os
import sys

# Set production DB URL before importing database module
# This ensures the engine connects to Supabase
PROD_DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"
os.environ["DATABASE_URL"] = PROD_DATABASE_URL

from sqlalchemy import create_engine
import models

def create_prod_tables():
    print("🔌 Connecting to Supabase Production...")
    print(f"   URL: {PROD_DATABASE_URL[:20]}...")
    
    # Create valid engine for Postgres
    engine = create_engine(PROD_DATABASE_URL)
    
    print("🏗️  Creating tables...")
    # This will create tables that don't exist. It won't update existing ones (no migration).
    models.Base.metadata.create_all(bind=engine)
    
    print("✅ Tables created successfully.")
    
    # Verify invitations table
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if "invitations" in tables:
        print("✅ 'invitations' table exists.")
    else:
        print("❌ 'invitations' table STILL MISSING!")

if __name__ == "__main__":
    create_prod_tables()
