
import psycopg2
import os

DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"

def diag():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    print("--- USERS ---")
    cur.execute("SELECT email, role, organization_id FROM users WHERE email LIKE '%demo%'")
    users = cur.fetchall()
    for u in users:
        print(f"Email: {u[0]}, Role: {u[1]}, OrgID: {u[2]}")
        
    print("\n--- ORGANIZATIONS ---")
    cur.execute("SELECT id, name, org_type, location_id FROM organizations")
    orgs = cur.fetchall()
    for o in orgs:
        print(f"ID: {o[0]}, Name: {o[1]}, Type: {o[2]}, LocationID: {o[3]}")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    diag()
