
import psycopg2
import os

DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"

def check_users():
    print("Connecting to Supabase Production...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        cursor.execute("SELECT email, role, organization_id, status FROM users")
        users = cursor.fetchall()
        
        print("\nUSERS IN PRODUCTION:")
        print("-" * 60)
        for user in users:
            print(f"Email: {user[0]} | Role: '{user[1]}' | OrgID: {user[2]} | Status: {user[3]}")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_users()
