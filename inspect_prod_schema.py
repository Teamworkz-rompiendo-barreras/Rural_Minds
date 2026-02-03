
import os
from sqlalchemy import create_engine, inspect

# Production DB URL
PROD_DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"

def inspect_schema():
    print("🔌 Connecting to Supabase Production...")
    engine = create_engine(PROD_DATABASE_URL)
    inspector = inspect(engine)
    
    tables_to_check = ["organizations", "audit_logs", "invitations"]
    
    for table in tables_to_check:
        print(f"\n📋 Table: {table}")
        if not inspector.has_table(table):
            print("   ❌ Table DOES NOT EXIST")
            continue
            
        columns = inspector.get_columns(table)
        print(f"   found {len(columns)} columns:")
        for col in columns:
            print(f"   - {col['name']} ({col['type']})")

if __name__ == "__main__":
    inspect_schema()
