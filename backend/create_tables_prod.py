
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

    # --- Manual Patching for missing columns in Organizations (Admin Dashboard Fix) ---
    from sqlalchemy import text
    from sqlalchemy.exc import ProgrammingError

    print("🔧 Patching 'organizations' table columns...")
    with engine.connect() as conn:
        columns_to_add = [
            ("seal_downloaded_at", "TIMESTAMP NULL"),
            ("location_id", "UUID NULL")
        ]
        
        for col_name, col_def in columns_to_add:
            try:
                # Start a nested transaction section if possible, or just rely on autocommit isolation if engine supports
                # For safety, we will just try/except and ensure we are clean.
                # Since we are in a block `with engine.connect() as conn`, it starts a transaction.
                # We need to use SAVEPOINTs or just try one by one in separate connections if this fails.
                # Simplest way: wrap in nested transaction
                with conn.begin_nested():
                    print(f"   Attempting to add: {col_name}...")
                    conn.execute(text(f"ALTER TABLE organizations ADD COLUMN {col_name} {col_def}"))
                print(f"   ✅ Added {col_name}")
            except ProgrammingError as e:
                # The nested transaction handles rollback of the failed statement automatically
                if "already exists" in str(e):
                    print(f"   ℹ️  Column {col_name} already exists.")
                else:
                    print(f"   ⚠️ Failed to add {col_name}: {e}")
            except Exception as e:
                 print(f"   ⚠️ General Error adding {col_name}: {e}")
                 
             
    # --- Check for AuditLog & AdjustmentsLog ---
            
    # --- Check for AuditLog & AdjustmentsLog ---
    if "audit_logs" not in tables:
        print("created audit_logs (via create_all)")
    if "adjustments_logs" not in tables:
        print("created adjustments_logs (via create_all)")

if __name__ == "__main__":
    create_prod_tables()
