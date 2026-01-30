
import urllib.request
import json
import urllib.error

def test_backend():
    print("Testing GET / ...")
    try:
        with urllib.request.urlopen("http://127.0.0.1:8000/") as response:
            print(f"GET Status: {response.getcode()}")
            print(f"GET Response: {response.read().decode()}")
    except urllib.error.URLError as e:
        print(f"GET Failed: {e}")

    print("\nTesting POST /auth/register ...")
    url = "http://127.0.0.1:8000/auth/register"
    data = json.dumps({
        "email": "test_enterprise_user@example.com",
        "password": "password123",
        "role": "enterprise"
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            print(f"POST Status: {response.getcode()}")
            print(f"POST Response: {response.read().decode()}")
    except urllib.error.HTTPError as e:
         print(f"POST Failed: {e.code} {e.reason}")
         print(f"Error Content: {e.read().decode()}")
    except urllib.error.URLError as e:
        print(f"POST Connection Failed: {e}")

    print("\nTesting POST /auth/token ...")
    token_url = "http://127.0.0.1:8000/auth/token"
    # Use form-data for OAuth2PasswordRequestForm
    from urllib.parse import urlencode
    token_data = urlencode({
        "username": "test_enterprise_user@example.com",
        "password": "password123"
    }).encode("utf-8")
    
    token_req = urllib.request.Request(token_url, data=token_data, method="POST")
    token = None
    try:
        with urllib.request.urlopen(token_req) as response:
            print(f"Token Status: {response.getcode()}")
            resp_json = json.loads(response.read().decode())
            token = resp_json["access_token"]
            print("Token received")
    except urllib.error.HTTPError as e:
         print(f"Token Failed: {e.code} {e.reason}")
         print(f"Error Content: {e.read().decode()}")

    if token:
        print("\nTesting POST /api/challenges ...")
        challenge_url = "http://127.0.0.1:8000/api/challenges"
        challenge_payload = json.dumps({
            "title": "Test Challenge",
            "description": "This is a test challenge",
            "problem_reason": "Testing",
            "deliverable_type": "software",
            "acceptance_criteria": ["Works"],
            "skills_required": ["Python"],
            "autonomy_level": 3,
            "modality": "remote",
            "communication_pref": "chat"
        }).encode("utf-8")
        
        chall_req = urllib.request.Request(challenge_url, data=challenge_payload, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }, method="POST")
        
        try:
            with urllib.request.urlopen(chall_req) as response:
                print(f"Challenge Status: {response.getcode()}")
                print(f"Challenge Response: {response.read().decode()}")
        except urllib.error.HTTPError as e:
             print(f"Challenge Failed: {e.code} {e.reason}")
             print(f"Error Content: {e.read().decode()}")

        print("\nTesting GET /api/my-challenges ...")
        my_chall_req = urllib.request.Request("http://127.0.0.1:8000/api/my-challenges", headers={
            "Authorization": f"Bearer {token}"
        })
        try:
            with urllib.request.urlopen(my_chall_req) as response:
                 print(f"My Challenges Status: {response.getcode()}")
                 print(f"My Challenges Response: {response.read().decode()}")
        except urllib.error.HTTPError as e:
             print(f"My Challenges Failed: {e.code} {e.reason}")
             print(f"Error Content: {e.read().decode()}")

if __name__ == "__main__":
    test_backend()
