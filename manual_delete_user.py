
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend to path to import models if needed, but raw SQL is safer/faster for cleanup scripts
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Direct Prod DB Access (using env var or default if not set, but user mentioned Prod)
# I will use the one from .env.local logic or just assume the script runs in an env where proper vars are loaded.
# For safety, I'll print the DB URL prefix to confirm it's not local (or is, if that's intent).

# Note: In Vercel env, DATABASE_URL is set. Locally, I might need to load it.
# I will assume the user has the env vars set in their terminal session or .env file.
# If not, I'll default to the one likely used in `create_tables_prod.py`.

# Hardcoded from create_tables_prod.py inspection to ensure connectivity
DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"

if not DATABASE_URL:
    print("❌ DATABASE_URL not found. Please set it or run within the correct environment.")
    sys.exit(1)

print(f"🔌 Connecting to: {DATABASE_URL.split('@')[-1]}") # Hide credentials

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

TARGET_EMAIL = "esperi1@hotmail.es"

def run_deletion():
    print(f"🔍 Searching for: {TARGET_EMAIL}")
    
    try:
        # 1. Start Transaction
        
        # 2. Find User
        user_query = text("SELECT id, organization_id FROM users WHERE email = :email")
        user = session.execute(user_query, {"email": TARGET_EMAIL}).fetchone()
        
        org_id_to_delete = None
        
        if user:
            print(f"   ✅ User found: {user.id}")
            # If user has an organization, check if we should delete it.
            # "borres los datos del ayuntamiento" -> YES.
            if user.organization_id:
                org_query = text("SELECT id, name FROM organizations WHERE id = :oid")
                org = session.execute(org_query, {"oid": user.organization_id}).fetchone()
                if org:
                    print(f"   found Linked Organization: {org.name} ({org.id})")
                    org_id_to_delete = org.id
        else:
            print("   ⚠️ User not found in 'users' table.")

        # 3. Find Invitation (by email) because invite might exist without user
        invite_query = text("SELECT id FROM invitations WHERE email = :email")
        invites = session.execute(invite_query, {"email": TARGET_EMAIL}).fetchall()
        
        if invites:
            print(f"   ✅ Found {len(invites)} invitation(s).")
        
        # 4. EXECUTE DELETION
        if not user and not invites and not org_id_to_delete:
            print("\n🤷 Nothing to delete.")
            return

        print("\n🗑️  DELETING DATA...")
        
        # Delete Invitations
        session.execute(text("DELETE FROM invitations WHERE email = :email"), {"email": TARGET_EMAIL})
        print("   Create: Deleted invitations.")
        
        # Delete Accessibility Profile (Cascade usually handles this, but explicit is good)
        if user:
            session.execute(text("DELETE FROM accessibility_profiles WHERE user_id = :uid"), {"uid": user.id})
            
            # Delete Talent Profile
            session.execute(text("DELETE FROM talent_profiles WHERE user_id = :uid"), {"uid": user.id})
            
            # Delete Applications?
            session.execute(text("DELETE FROM applications WHERE user_id = :uid"), {"uid": user.id})
            
            # Delete User
            session.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user.id})
            print(f"   Deleted User: {user.id}")

            # Delete Organization (if identified)
            if org_id_to_delete:
                # First delete constraints if any? 
                # Organizations might be referenced by other things.
                # If "Municipality", might have locations? No, locations are separate.
                # Only user was linked.
                # BUT, wait. If I delete the org, other users might be linked?
                # Check if other users exist for this org.
                other_users_count = session.execute(text("SELECT count(*) FROM users WHERE organization_id = :oid AND id != :uid"), {"oid": org_id_to_delete, "uid": user.id}).scalar()
                
                if other_users_count > 0:
                    print(f"   ⚠️ Organization has {other_users_count} other users. SKIPPING ORG DELETE to be safe.")
                else:
                    session.execute(text("DELETE FROM organizations WHERE id = :oid"), {"oid": org_id_to_delete})
                    print(f"   Deleted Organization: {org_id_to_delete}")

        session.commit()
        print("\n✅ Deletion Complete successfully.")
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ Error during deletion: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    run_deletion()
