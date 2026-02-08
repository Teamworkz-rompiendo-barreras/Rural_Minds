
import psycopg2

DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"

def get_schema():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        for table in ['talent_profiles', 'organizations']:
            print(f"\n--- {table} ---")
            cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'")
            cols = cur.fetchall()
            for c in cols:
                print(c[0])
                
        # Also let's check one location ID
        print("\n--- locations (one) ---")
        cur.execute("SELECT id, province, municipality FROM locations LIMIT 1")
        print(cur.fetchone())
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_schema()
