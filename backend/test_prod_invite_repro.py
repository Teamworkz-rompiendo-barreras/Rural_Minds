
import requests
import sys

# Production URL
BASE_URL = "https://rural-minds.vercel.app"
LOGIN_URL = f"{BASE_URL}/auth/login"
INVITE_URL = f"{BASE_URL}/admin/invite"

EMAIL = "rural.minds@teamworkz.co"
PASSWORD = "RuralMinds2026!"

def test_invite_crash():
    print("1. Logging in as Superadmin...")
    try:
        resp = requests.post(LOGIN_URL, data={"username": EMAIL, "password": PASSWORD})
        if resp.status_code != 200:
            print(f"❌ Login failed: {resp.status_code} {resp.text}")
            return
            
        token = resp.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Login successful")
        
        # 2. Attempting Invite
        payload = {
            "email": "test.invite.debug@teamworkz.co",
            "entity_name": "Ayuntamiento Debug",
            "role": "municipality"
        }
        
        print(f"2. Sending Invitation to {payload['email']}...")
        resp = requests.post(INVITE_URL, json=payload, headers=headers)
        
        print(f"Status Code: {resp.status_code}")
        print(f"Response: {resp.text}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_invite_crash()
