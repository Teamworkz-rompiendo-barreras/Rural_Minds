import requests

# Test the minimal diagnostic endpoint
URL = "https://rural-minds.vercel.app/api/ping"

def test_ping():
    print(f"Testing: {URL}")
    try:
        resp = requests.get(URL, timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

def test_diag():
    url = "https://rural-minds.vercel.app/api/diag"
    print(f"\nTesting: {url}")
    try:
        resp = requests.get(url, timeout=15)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ping()
    test_diag()
