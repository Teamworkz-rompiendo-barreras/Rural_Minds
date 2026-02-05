"""
Script to create 3 test user profiles in Supabase Production:
1. Ayuntamiento (Municipality)
2. Empresa (Enterprise)  
3. Candidato (Talent)
"""

import psycopg2
import uuid
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auth  # Uses pbkdf2_sha256

# Supabase Production Connection
DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"

# Test user profiles
TEST_USERS = [
    {
        "email": "ayuntamiento.demo@ruralminds.es",
        "password": "Demo2026!",
        "full_name": "Demo Ayuntamiento Villanueva",
        "role": "municipality",
        "org_name": "Ayuntamiento de Villanueva",
        "org_type": "municipality"
    },
    {
        "email": "empresa.demo@ruralminds.es",
        "password": "Demo2026!",
        "full_name": "Demo Empresa TechRural",
        "role": "enterprise",
        "org_name": "TechRural Soluciones S.L.",
        "org_type": "enterprise"
    },
    {
        "email": "candidato.demo@ruralminds.es",
        "password": "Demo2026!",
        "full_name": "Ana García Demo",
        "role": "talent",
        "org_name": None,  # Talent doesn't need org
        "org_type": None
    }
]

def create_test_users():
    print("🔌 Connecting to Supabase Production...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        print("✅ Connected to Supabase\n")
        
        created_users = []
        
        for user_data in TEST_USERS:
            email = user_data["email"]
            password = user_data["password"]
            full_name = user_data["full_name"]
            role = user_data["role"]
            org_name = user_data["org_name"]
            org_type = user_data["org_type"]
            
            print(f"📝 Creating {role} user: {email}")
            
            # Generate password hash
            hashed_pwd = auth.get_password_hash(password)
            
            # Check if user already exists
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            existing = cursor.fetchone()
            
            if existing:
                user_id = existing[0]
                # Update existing user
                cursor.execute("""
                    UPDATE users 
                    SET role = %s,
                        hashed_password = %s,
                        email_verified = true,
                        status = 'active',
                        full_name = %s
                    WHERE email = %s
                """, (role, hashed_pwd, full_name, email))
                print(f"   ✅ Updated existing user")
            else:
                # Create new user
                user_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO users (id, email, full_name, hashed_password, role, status, email_verified)
                    VALUES (%s, %s, %s, %s, %s, 'active', true)
                """, (user_id, email, full_name, hashed_pwd, role))
                print(f"   ✅ Created new user (ID: {user_id[:8]}...)")
            
            # Create organization if needed (for municipality and enterprise)
            if org_name and org_type:
                # Check if org with this name exists
                cursor.execute("SELECT id FROM organizations WHERE name = %s", (org_name,))
                existing_org = cursor.fetchone()
                
                if existing_org:
                    org_id = existing_org[0]
                    cursor.execute("""
                        UPDATE organizations
                        SET org_type = %s, validation_status = 'validated'
                        WHERE id = %s
                    """, (org_type, org_id))
                    print(f"   ✅ Updated organization: {org_name}")
                else:
                    org_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO organizations (id, name, org_type, validation_status)
                        VALUES (%s, %s, %s, 'validated')
                    """, (org_id, org_name, org_type))
                    print(f"   ✅ Created organization: {org_name}")
                
                # Update user's organization_id
                cursor.execute("UPDATE users SET organization_id = %s WHERE id = %s", (org_id, user_id))
            
            created_users.append({
                "role": role,
                "email": email,
                "password": password,
                "full_name": full_name,
                "org_name": org_name
            })
            print()
        
        conn.commit()
        
        # Print summary
        print("=" * 60)
        print("🎉 PERFILES DE PRUEBA CREADOS")
        print("=" * 60)
        print(f"\n🌐 URL de acceso: https://rural-minds.vercel.app/login\n")
        
        for user in created_users:
            print(f"👤 {user['role'].upper()}")
            print(f"   Nombre: {user['full_name']}")
            if user['org_name']:
                print(f"   Organización: {user['org_name']}")
            print(f"   📧 Email: {user['email']}")
            print(f"   🔑 Contraseña: {user['password']}")
            print()
        
        cursor.close()
        conn.close()
        print("✅ Conexión cerrada")
        
        return created_users
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise

if __name__ == "__main__":
    create_test_users()
