
import requests
import json

BASE_URL = "https://backend-mu-orpin-37.vercel.app" # The backend URL from browser logs
EMAIL = "ayuntamiento.demo@ruralminds.es"
PASSWORD = "Demo2026!"

def test_municipality_auth():
    print(f"Testing Auth for {EMAIL}...")
    
    # 1. Login
    login_url = f"{BASE_URL}/auth/login"
    payload = {
        "username": EMAIL,
        "password": PASSWORD
    }
    # FastAPI OAuth2PasswordRequestForm expects form-data
    response = requests.post(login_url, data=payload)
    
    if response.status_code != 200:
        print(f"FAILED Login: {response.status_code}")
        print(response.text)
        return

    token = response.json()["access_token"]
    print(f"Login Successful. Token starts with: {token[:10]}...")

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check /auth/me
    me_res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print(f"\n/auth/me Response ({me_res.status_code}):")
    user_data = me_res.json()
    print(json.dumps(user_data, indent=2))
    role = user_data.get("role")
    print(f"Detected Role in Backend: '{role}'")

    # 3. Check /municipality/stats
    stats_res = requests.get(f"{BASE_URL}/municipality/stats", headers=headers)
    print(f"\n/municipality/stats Response ({stats_res.status_code}):")
    print(stats_res.text)

    # 4. Check /municipality/companies-status
    status_res = requests.get(f"{BASE_URL}/municipality/companies-status", headers=headers)
    print(f"\n/municipality/companies-status Response ({status_res.status_code}):")
    print(status_res.text)

if __name__ == "__main__":
    test_municipality_auth()
