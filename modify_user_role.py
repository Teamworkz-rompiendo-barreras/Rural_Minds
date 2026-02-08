
import psycopg2
import os

DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"

def update_role():
    print("Connecting to Supabase Production...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        email = "ayuntamiento.demo@ruralminds.es"
        new_role = "territory_admin"
        
        print(f"Updating role for {email} to '{new_role}'...")
        cursor.execute(
            "UPDATE users SET role = %s WHERE email = %s",
            (new_role, email)
        )
        
        if cursor.rowcount > 0:
            print("Successfully updated role.")
            conn.commit()
        else:
            print("User not found or role already set.")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_role()
