import requests

# Test login against production API
API_URL = "https://rural-minds.vercel.app/api/auth/login"
EMAIL = "rural.minds@teamworkz.co"
PASSWORD = "RuralMinds2026!"

def test_login():
    # Try different endpoint variations
    endpoints = [
        "https://rural-minds.vercel.app/auth/login",
        "https://rural-minds.vercel.app/api/auth/login"
    ]
    
    for url in endpoints:
        print(f"Testing login to: {url}")
        try:
            resp = requests.post(url, data={"username": EMAIL, "password": PASSWORD})
            print(f"Status Code: {resp.status_code}")
            if resp.status_code == 200:
                print(f"✅ SUCCESS! Token received: {resp.json().get('access_token')[:20]}...")
            else:
                print(f"Response: {resp.text}")
        except Exception as e:
            print(f"Error: {e}")
        print("-" * 30)

if __name__ == "__main__":
    test_login()
