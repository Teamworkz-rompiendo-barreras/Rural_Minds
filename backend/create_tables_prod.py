
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
    print("🔧 Patching 'organizations' table columns...")
    with engine.connect() as conn:
        try:
            # validation_status
            conn.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS validation_status VARCHAR DEFAULT 'pending'"))
            # branding_logo_url
            conn.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS branding_logo_url VARCHAR NULL"))
            # municipality_id
            conn.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS municipality_id UUID NULL"))
            # org_type (ensure it exists, might overlap)
            conn.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS org_type VARCHAR DEFAULT 'enterprise'"))
            
            print("✅ 'organizations' columns patched.")
        except Exception as e:
            print(f"⚠️ Error patching columns: {e}")
            
    # --- Check for AuditLog & AdjustmentsLog ---
    if "audit_logs" not in tables:
        print("created audit_logs (via create_all)")
    if "adjustments_logs" not in tables:
        print("created adjustments_logs (via create_all)")

if __name__ == "__main__":
    create_prod_tables()
