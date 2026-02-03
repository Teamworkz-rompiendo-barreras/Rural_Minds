import requests
import sys

# Config
BASE_URL = "http://localhost:8001"
MUNI_EMAIL = "ayto_v3@test.com"
MUNI_PWD = "password123"

# Company to create
COMPANY_EMAIL = "empresa_pruebas@example.com"
COMPANY_NAME = "Empresa de Pruebas S.L."
COMPANY_PWD = "password123"

def simulate():
    print(f"--- FASE 3: El Motor Económico (Empresa) ---")
    session = requests.Session()
    
    # 1. Login as Municipality
    print(f"Logging in as {MUNI_EMAIL}...")
    resp = session.post(f"{BASE_URL}/auth/login", data={"username": MUNI_EMAIL, "password": MUNI_PWD})
    if resp.status_code != 200:
        print(f"❌ Municipality Login Failed: {resp.text}")
        sys.exit(1)
        
    muni_token = resp.json()["access_token"]
    session.headers.update({"Authorization": f"Bearer {muni_token}"})
    
    # Get my Org ID (needed for ref)
    resp = session.get(f"{BASE_URL}/auth/me")
    me = resp.json()
    org_id = me["organization_id"]
    print(f"✅ Logged in. Org ID (Ref): {org_id}")
    
    # 2. Invite Company (Optional step to verify email flow, but registration depends on ref)
    print(f"Inviting {COMPANY_EMAIL}...")
    resp = session.post(f"{BASE_URL}/municipality/invite-companies", json={
        "emails": [COMPANY_EMAIL],
        "signature": "Alcalde"
    })
    
    if resp.status_code == 200:
         print("✅ Invitation Sent")
    else:
         print(f"❌ Invite Failed: {resp.text}")
         
    # 3. Register Company (As User)
    print("Registering Company...")
    # New session for company
    comp_session = requests.Session()
    
    # Register Payload
    # Check Register payload in auth_routes. It typically accepts 'municipality_id' or 'referral_token'?
    # Usually frontend passes `municipality_id` derived from `ref` query param.
    # So we pass `municipality_id: org_id`.
    
    reg_payload = {
        "user_data": {
            "email": COMPANY_EMAIL,
            "password": COMPANY_PWD,
            "full_name": "CEO Empresa",
            "role": "enterprise"
        },
        "org_data": {
            "name": COMPANY_NAME,
            "municipality_id": org_id  # This links them!
        }
    }
    
    resp = comp_session.post(f"{BASE_URL}/auth/register", json=reg_payload)
    if resp.status_code == 200:
        print("✅ Company Registration Successful")
        data = resp.json()
        print(f"🔑 Company Token: {data['access_token'][:20]}...")
        
        # Verify Linkage via Municipality Dashboard API
        # Switch back to muni session
        status_resp = session.get(f"{BASE_URL}/municipality/companies-status")
        if status_resp.status_code == 200:
            active = status_resp.json()["active"]
            linked = any(c["name"] == COMPANY_NAME for c in active)
            if linked:
                print("✅ Verified: Company appears in Municipality Dashboard")
            else:
                 print(f"⚠️ Warning: Company registered but not in dashboard list? List: {active}")
    else:
        print(f"❌ Company Register Failed: {resp.text}")
        if "already registered" in resp.text:
            print("⚠️ Already registered (Expected on retry)")

if __name__ == "__main__":
    simulate()
