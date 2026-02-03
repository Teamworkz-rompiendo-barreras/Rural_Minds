import requests
import sys
from sqlalchemy import create_engine, text

# Config
BASE_URL = "http://localhost:8001"
DB_URL = "sqlite:///./teamworkz.db"
INVITE_EMAIL = "ayto_v3@test.com"
ADMIN_NAME = "Alcalde de Pruebas"
PASSWORD = "password123"

def get_db_token(email):
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT token FROM invitations WHERE email = :email AND status = 'pending' ORDER BY created_at DESC LIMIT 1"), {"email": email})
        row = result.fetchone()
        return row[0] if row else None

def simulate():
    print(f"--- FASE 2: El Anfitrión (Ayuntamiento) ---")
    
    # 1. Get Token
    token = get_db_token(INVITE_EMAIL)
    if not token:
        print("❌ No PENDING invitation found for", INVITE_EMAIL)
        sys.exit(1)
        
    print(f"Found Token: {token}")
    
    # 2. Register
    payload = {
        "token": token,
        "password": PASSWORD,
        "full_name": ADMIN_NAME
    }
    
    print("Registering...")
    resp = requests.post(f"{BASE_URL}/auth/register-invitation", json=payload)
    
    if resp.status_code == 200:
        data = resp.json()
        print("✅ Registration Successful")
        print(f"🔑 Access Token: {data['access_token'][:20]}...")
        
        # Verify Validation Status (Wizard usually updates this later, but check defaults)
        # Assuming defaults are pre-wizard.
    else:
        print(f"❌ Registration Failed: {resp.text}")
        sys.exit(1)

if __name__ == "__main__":
    simulate()
