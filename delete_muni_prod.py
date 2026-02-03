
import os
import sys
from sqlalchemy import create_engine, text

# Set production DB URL
PROD_DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"
os.environ["DATABASE_URL"] = PROD_DATABASE_URL

def delete_data():
    print("🔌 Connecting to Supabase Production...")
    engine = create_engine(PROD_DATABASE_URL)
    
    target_email = "esperi1@hotmail.es"
    target_org_name = "Ayuntamiento de Mi Casa"
    
    with engine.connect() as conn:
        print(f"🔍 Searching for user: {target_email}")
        
        # 1. Find User
        result = conn.execute(text("SELECT id, organization_id FROM users WHERE email = :email"), {"email": target_email}).fetchone()
        
        user_id = None
        org_id_from_user = None
        
        if result:
            user_id = result[0]
            org_id_from_user = result[1]
            print(f"   ✅ Found User ID: {user_id}")
            print(f"   Link Org ID: {org_id_from_user}")
        else:
            print("   ❌ User not found.")
            
        # 2. Find Organization by Name
        print(f"🔍 Searching for organization: {target_org_name}")
        res_org = conn.execute(text("SELECT id FROM organizations WHERE name = :name"), {"name": target_org_name}).fetchone()
        
        org_id_by_name = None
        if res_org:
            org_id_by_name = res_org[0]
            print(f"   ✅ Found Org ID by Name: {org_id_by_name}")
        else:
            print("   ❌ Organization by name not found.")
            
        # 3. Execute Deletion
        # Delete User first (if found)
        if user_id:
            print(f"🗑️  Deleting User {user_id}...")
            conn.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id})
            print("   ✅ User deleted.")
            
        # Delete Organization associated with user (if found)
        if org_id_from_user:
             print(f"🗑️  Deleting Linked Organization {org_id_from_user}...")
             conn.execute(text("DELETE FROM organizations WHERE id = :id"), {"id": org_id_from_user})
             print("   ✅ Linked Organization deleted.")
             
        # Delete Organization by name (if different and found)
        if org_id_by_name and org_id_by_name != org_id_from_user:
             print(f"🗑️  Deleting Named Organization {org_id_by_name}...")
             conn.execute(text("DELETE FROM organizations WHERE id = :id"), {"id": org_id_by_name})
             print("   ✅ Named Organization deleted.")

        # Delete any Invitations for this email
        print(f"SEARCHING invitations for {target_email}...")
        conn.execute(text("DELETE FROM invitations WHERE email = :email"), {"email": target_email})
        print("   ✅ Invitations cleanup executed.")
             
        conn.commit()
        print("✨ All Done.")

if __name__ == "__main__":
    delete_data()
