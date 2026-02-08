
import psycopg2
import uuid

DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"

def link_candidate():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Get Candidate ID
        cur.execute("SELECT id FROM users WHERE email = 'candidato.demo@ruralminds.es'")
        user_id = cur.fetchone()[0]
        print(f"User ID: {user_id}")
        
        # Get Location ID for Villanueva
        cur.execute("SELECT location_id FROM organizations WHERE name = 'Ayuntamiento de Villanueva'")
        location_id = cur.fetchone()[0]
        print(f"Location ID: {location_id}")
        
        # Check if profile exists
        cur.execute("SELECT id FROM talent_profiles WHERE user_id = %s", (user_id,))
        profile = cur.fetchone()
        
        if profile:
            print("Updating existing profile...")
            cur.execute(
                "UPDATE talent_profiles SET residence_location_id = %s, target_locations = %s WHERE user_id = %s",
                (location_id, [str(location_id)], user_id)
            )
        else:
            print("Creating new profile...")
            cur.execute(
                "INSERT INTO talent_profiles (id, user_id, residence_location_id, target_locations) VALUES (%s, %s, %s, %s)",
                (str(uuid.uuid4()), user_id, location_id, [str(location_id)])
            )
            
        conn.commit()
        print("Success!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    link_candidate()
