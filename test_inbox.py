
import psycopg2
import uuid
import requests

DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!%23@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"
BASE_URL = "https://rural-minds.vercel.app"
MUNI_EMAIL = "ayuntamiento.demo@ruralminds.es"
MUNI_PWD = "Demo2026!"
CAND_EMAIL = "candidato.demo@ruralminds.es"

def test_inbox_flow():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # 1. Get IDs
        cur.execute("SELECT id FROM users WHERE email = %s", (CAND_EMAIL,))
        cand_user_id = cur.fetchone()[0]
        
        cur.execute("SELECT id FROM users WHERE email = %s", (MUNI_EMAIL,))
        muni_user_id = cur.fetchone()[0]
        
        cur.execute("SELECT organization_id FROM users WHERE email = %s", (MUNI_EMAIL,))
        muni_org_id = cur.fetchone()[0]
        
        # 2. Ensure Talent Profile exists
        cur.execute("SELECT id FROM talent_profiles WHERE user_id = %s", (cand_user_id,))
        profile = cur.fetchone()
        if not profile:
            tp_id = str(uuid.uuid4())
            cur.execute("INSERT INTO talent_profiles (id, user_id) VALUES (%s, %s)", (tp_id, cand_user_id))
            conn.commit()
            print(f"Created Talent Profile: {tp_id}")
        else:
            tp_id = profile[0]
            print(f"Using existing Talent Profile: {tp_id}")
            
        cur.close()
        conn.close()
        
        # 3. Login as Muni to send message
        login_res = requests.post(f"{BASE_URL}/auth/login", data={"username": MUNI_EMAIL, "password": MUNI_PWD})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 4. Check Talent List
        print("Checking Talent List endpoints...")
        for ep in ["/api/municipality/talent/local", "/api/municipality/talent/attraction"]:
             r = requests.get(f"{BASE_URL}{ep}", headers=headers)
             print(f"GET {ep} -> {r.status_code}")
             
        # 5. Send Message
        msg_payload = {
            "content": "Test message from automated verification.",
            "highlighted_need": "Social Support"
        }
        send_url = f"{BASE_URL}/api/municipality/talent/{tp_id}/contact"
        print(f"Sending message to {send_url}...")
        res = requests.post(send_url, json=msg_payload, headers=headers)
        print(f"Send Status: {res.status_code}")
        if res.status_code != 200:
             print(f"Response: {res.text[:200]}")
        else:
             print("SUCCESS: Message sent!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_inbox_flow()
