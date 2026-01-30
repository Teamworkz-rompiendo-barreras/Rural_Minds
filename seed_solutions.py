
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

seed_data = [
    {
        "title": "NVDA Screen Reader",
        "description": "Free, open source, portable screen reader for Microsoft Windows. Enables blind and vision impaired people to access computers.",
        "category": "software",
        "impact_level": "high",
        "cost_estimate": "Free",
        "image_url": "https://www.nvaccess.org/wp-content/uploads/2019/07/NVLogo_white_200.png"
    },
    {
        "title": "Noise Cancelling Headphones (Sony WH-1000XM5)",
        "description": "Industry-leading noise cancellation to reduce auditory sensory overload in open office environments.",
        "category": "hardware",
        "impact_level": "transp",
        "cost_estimate": "$$$"
    },
    {
        "title": "Async-First Communication Protocol",
        "description": "Standard operating procedure prioritizing written, asynchronous communication over real-time meetings to reduce social anxiety and interruption.",
        "category": "protocol",
        "impact_level": "high",
        "cost_estimate": "Free"
    },
    {
        "title": "Low-Blue Light Filter (f.lux)",
        "description": "Software that adjusts the color temperature of your display to match the time of day, reducing eye strain and circadian disruption.",
        "category": "software",
        "impact_level": "medium",
        "cost_estimate": "Free"
    },
    {
        "title": "Adjustable Standing Desk",
        "description": "Motorized desk allowing transition between sitting and standing to accommodate physical restlessness and ergonomic needs.",
        "category": "environment",
        "impact_level": "medium",
        "cost_estimate": "$$"
    }
]

def get_token():
    # Login as a known user or create one
    # Assuming verify_matching.py created 'ent_match_...' or similar.
    # We'll try to register a specialized admin user
    email = "admin_seed@test.com"
    password = "password123"
    
    # 1. Register
    reg_data = {"email": email, "password": password, "role": "super_admin"}
    requests.post(f"{BASE_URL}/auth/register", json=reg_data)
    
    # 2. Login
    data = {"username": email, "password": password}
    res = requests.post(f"{BASE_URL}/auth/token", data=data)
    if res.status_code == 200:
        return res.json()["access_token"]
    print(f"Login failed: {res.text}")
    return None

def seed():
    print("Authenticating...")
    token = get_token()
    if not token:
        return

    headers = {"Authorization": f"Bearer {token}"}
    print("Seeding solutions...")
    
    for item in seed_data:
        try:
            res = requests.post(f"{BASE_URL}/api/solutions/", json=item, headers=headers)
            if res.status_code == 200:
                print(f"Created: {item['title']}")
            else:
                print(f"Failed {item['title']}: {res.status_code} {res.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    seed()
