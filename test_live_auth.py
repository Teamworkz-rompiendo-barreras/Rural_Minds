
import requests

BASE_URL = "https://rural-minds.vercel.app"

def test_auth():
    print(f"Testing against {BASE_URL}...")

    # 1. Health Check
    try:
        resp = requests.get(f"{BASE_URL}/api/status")
        print(f"GET /api/status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Health check failed: {e}")

    # 2. Register
    email = "debug_user_001@example.com"
    password = "password123"
    print(f"\nAttempting verification/registration for {email}...")
    
    # Try login first to see if user exists
    login_data = {"username": email, "password": password}
    resp = requests.post(f"{BASE_URL}/auth/token", data=login_data) # Standard OAuth2 endpoint usually at /token or similar, checking code
    
    # Checking specific endpoints based on code knowledge
    # In auth_routes.py we likely have /auth/login or /auth/token
    
    # Let's try to register
    register_data = {
        "email": email,
        "password": password,
        "full_name": "Debug User",
        "role": "talent"
    }
    resp = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"POST /auth/register status: {resp.status_code}")
    print(f"Response: {resp.text}")

if __name__ == "__main__":
    test_auth()
