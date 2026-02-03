import requests

# Test login against production API
API_URL = "https://rural-minds.vercel.app/api/auth/login"
EMAIL = "rural.minds@teamworkz.co"
PASSWORD = "RuralMinds2026!"

def test_login():
    print(f"Testing login to: {API_URL}")
    print(f"Email: {EMAIL}")
    
    resp = requests.post(API_URL, data={"username": EMAIL, "password": PASSWORD})
    
    print(f"\nStatus Code: {resp.status_code}")
    print(f"Response: {resp.text}")

if __name__ == "__main__":
    test_login()
