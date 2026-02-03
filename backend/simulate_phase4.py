import requests
import sys
from sqlalchemy import create_engine, text

# Config
BASE_URL = "http://localhost:8001"
DB_URL = "sqlite:///./teamworkz.db"

# Talent to register
TALENT_EMAIL = "talento_test@example.com"
TALENT_NAME = "María Desarrolladora"
TALENT_PWD = "password123"
MUNI_ORG_ID = None  # Will be fetched

def activate_user(email):
    """Simulate email verification by directly activating in DB."""
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        conn.execute(text("UPDATE users SET email_verified = 1, status = 'active' WHERE email = :email"), {"email": email})
        conn.commit()
    print(f"✅ User {email} activated in DB")

def simulate():
    print("--- FASE 4: El Protagonista (Talento) ---")
    
    # 1. Register Talent
    print(f"Registering Talent: {TALENT_NAME}...")
    reg_payload = {
        "user_data": {
            "email": TALENT_EMAIL,
            "password": TALENT_PWD,
            "full_name": TALENT_NAME,
            "role": "talent"
        },
        "org_data": {}  # Talents don't need org initially
    }
    
    resp = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    if resp.status_code == 200:
        print("✅ Talent Registration Initiated (Needs Email Verification)")
        # Simulate email click by activating directly in DB
        activate_user(TALENT_EMAIL)
    elif "already registered" in resp.text.lower():
        print("⚠️ Talent already registered (Using existing)")
    else:
        print(f"❌ Talent Registration Failed: {resp.text}")
        sys.exit(1)

    # 2. Login as Talent
    print("Logging in as Talent...")
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": TALENT_EMAIL, "password": TALENT_PWD})
    if resp.status_code != 200:
        print(f"❌ Talent Login Failed: {resp.text}")
        sys.exit(1)
    
    talent_token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {talent_token}"}
    print("✅ Talent Logged In")
    
    # 3. Mark Interest in Municipality (Simulated via API if available)
    # Assuming there's an endpoint like /profile/target-locations or similar
    # For now, we just verify the talent can see challenges
    print("Fetching Challenges (Matching)...")
    resp = requests.get(f"{BASE_URL}/challenges", headers=headers)
    if resp.status_code == 200:
        challenges = resp.json()
        print(f"✅ Found {len(challenges)} Challenges")
        if len(challenges) > 0:
            print(f"   First Challenge: {challenges[0].get('title', 'N/A')}")
    else:
        print(f"⚠️ Could not fetch challenges: {resp.text}")
    
    print("\n--- Fase 4 Complete ---")
    print("Manual Checks Required:")
    print("  [ ] Zoom 400% hamburger menu test (MANUAL)")
    print("  [ ] Welcome email received (Check DEV console)")

if __name__ == "__main__":
    simulate()
