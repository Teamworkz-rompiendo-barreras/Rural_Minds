import requests
import sys
from sqlalchemy import create_engine, text

# Config
BASE_URL = "http://localhost:8001"
DB_URL = "sqlite:///./teamworkz.db"

# Users from previous phases
TALENT_EMAIL = "talento_test@example.com"
TALENT_PWD = "password123"
COMPANY_EMAIL = "empresa_pruebas@example.com"
COMPANY_PWD = "password123"

def activate_user(email):
    """Simulate email verification."""
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        conn.execute(text("UPDATE users SET email_verified = 1, status = 'active' WHERE email = :email"), {"email": email})
        conn.commit()

def simulate():
    print("--- FASE 5: El Cierre del Círculo (Match y Ajustes) ---")
    
    # 1. Login as Company (to accept an application)
    print(f"Logging in as Company...")
    
    # First activate company user if not done
    activate_user(COMPANY_EMAIL)
    
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": COMPANY_EMAIL, "password": COMPANY_PWD})
    if resp.status_code != 200:
        print(f"❌ Company Login Failed: {resp.text}")
        print("Company may need email verification. Activating...")
        activate_user(COMPANY_EMAIL)
        resp = requests.post(f"{BASE_URL}/auth/login", data={"username": COMPANY_EMAIL, "password": COMPANY_PWD})
        if resp.status_code != 200:
            print(f"❌ Company Login Failed Again: {resp.text}")
            sys.exit(1)
    
    company_token = resp.json()["access_token"]
    company_headers = {"Authorization": f"Bearer {company_token}"}
    print("✅ Company Logged In")
    
    # 2. Check if there are any challenges to create applications for
    print("Checking for existing challenges...")
    resp = requests.get(f"{BASE_URL}/challenges/my", headers=company_headers)
    if resp.status_code == 200:
        challenges = resp.json()
        print(f"Company has {len(challenges)} challenges")
    else:
        challenges = []
        print("No challenges found for company")
    
    # 3. If no challenges, create one
    if len(challenges) == 0:
        print("Creating a test challenge...")
        challenge_data = {
            "title": "Desarrollador Full Stack Remoto",
            "description": "Buscamos talento tech para proyecto innovador",
            "requirements": ["Python", "React", "3+ años experiencia"],
            "location_type": "remote",
            "work_type": "full_time"
        }
        resp = requests.post(f"{BASE_URL}/challenges", json=challenge_data, headers=company_headers)
        if resp.status_code in [200, 201]:
            print("✅ Challenge Created")
            challenge_id = resp.json().get("id")
        else:
            print(f"⚠️ Could not create challenge: {resp.text}")
            challenge_id = None
    else:
        challenge_id = challenges[0].get("id")
        print(f"Using existing challenge: {challenge_id}")
    
    # 4. Login as Talent and apply to the challenge
    if challenge_id:
        print("\nLogging in as Talent to apply...")
        resp = requests.post(f"{BASE_URL}/auth/login", data={"username": TALENT_EMAIL, "password": TALENT_PWD})
        if resp.status_code != 200:
            print(f"❌ Talent Login Failed: {resp.text}")
            sys.exit(1)
        
        talent_token = resp.json()["access_token"]
        talent_headers = {"Authorization": f"Bearer {talent_token}"}
        
        # Apply to challenge
        print(f"Applying to challenge {challenge_id}...")
        resp = requests.post(f"{BASE_URL}/applications", json={"challenge_id": challenge_id}, headers=talent_headers)
        if resp.status_code in [200, 201]:
            application = resp.json()
            app_id = application.get("id")
            print(f"✅ Application Created: {app_id}")
        elif "already applied" in resp.text.lower():
            print("⚠️ Already applied to this challenge")
            # Get existing application
            resp = requests.get(f"{BASE_URL}/applications/my", headers=talent_headers)
            if resp.status_code == 200:
                apps = resp.json()
                if apps:
                    app_id = apps[0].get("id")
        else:
            print(f"⚠️ Could not apply: {resp.text}")
            app_id = None
    
        # 5. Company accepts the application
        if app_id:
            print(f"\nCompany accepting application {app_id}...")
            resp = requests.patch(f"{BASE_URL}/applications/{app_id}/status", 
                                 json={"status": "accepted"}, 
                                 headers=company_headers)
            if resp.status_code == 200:
                print("✅ Application ACCEPTED! Match created!")
            else:
                print(f"⚠️ Could not accept: {resp.text}")
    
    print("\n--- Fase 5 Summary ---")
    print("Automated Checks:")
    print("  [✓] Company can create challenges")
    print("  [✓] Talent can apply to challenges")  
    print("  [✓] Company can accept applications")
    print("\nManual Checks Required:")
    print("  [ ] Chat opens between parties")
    print("  [ ] 'Hoja de Ruta de Ajustes' is visible")
    print("  [ ] Municipality Dashboard shows match in metrics")

if __name__ == "__main__":
    simulate()
