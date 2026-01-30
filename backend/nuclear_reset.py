import os
import psycopg2
from urllib.parse import urlparse

# Load env manually or assume it's set
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def nuclear_reset():
    print("☢️  NUCLEAR RESET INITIATED for Supabase...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Get all table names
        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE';
        """)
        rows = cur.fetchall()
        tables = [row[0] for row in rows]
        
        if not tables:
            print("✅ No tables found to delete.")
        else:
            print(f"⚠️  Found tables: {', '.join(tables)}")
            
            # Disable triggers/constraints check momentarily not possible easily in RDS/Supabase for all, 
            # so we use CASCADE
            for table in tables:
                print(f"🔥 Dropping table: {table} CASCADE")
                cur.execute(f"DROP TABLE IF EXISTS \"{table}\" CASCADE;")
            
        conn.commit()
        cur.close()
        conn.close()
        print("✅  All tables dropped successfully.")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    nuclear_reset()
