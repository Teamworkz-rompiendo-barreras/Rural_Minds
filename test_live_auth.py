
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
    import uuid
    random_id = str(uuid.uuid4())[:8]
    email = f"debug_{random_id}@example.com"
    password = "password123"
    print(f"\nAttempting registration for {email}...")
    
    register_data = {
        "user_data": {
            "email": email,
            "password": password,
            "full_name": "Debug User",
            "role": "talent"
        },
        "org_data": {
            "name": f"Org-{random_id}"
        }
    }
    # Note: verify correct payload structure from auth_routes.py
    # auth_routes.py register expects payload: dict with "user_data", "org_data" keys?
    # Let's double check auth_routes.py content from Step 94.
    # Step 94 line 21: payload: dict... 
    # line 28/29: org_data = payload.get("org_data"), user_data = payload.get("user_data")
    # Yes, nested structure is required.

    resp = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"POST /auth/register status: {resp.status_code}")
    print(f"Response: {resp.text}")


    # 2.5 FIX SCHEMA (Run this first!)
    print(f"\nAttempting Schema Fix...")
    try:
        resp = requests.get(f"{BASE_URL}/debug/schema_fix")
        print(f"GET /debug/schema_fix status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Schema fix failed: {e}")

    # 3. Debug Info
    print(f"\nChecking Debug Info...")

    try:
        resp = requests.get(f"{BASE_URL}/debug/info")
        print(f"GET /debug/info status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Debug info failed: {e}")
        
if __name__ == "__main__":
    test_auth()

