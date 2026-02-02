
import os
import sys

# Simulate Vercel environment path setup
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Set env vars
os.environ['DATABASE_URL'] = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"
os.environ['SECRET_KEY'] = "debug_secret"

print("Attempting to import main...")
try:
    from main import app
    print("✅ Successfully imported main.app")
except Exception as e:
    print(f"❌ Failed to import main: {e}")
    import traceback
    traceback.print_exc()

# If import succeeds, try to run a startup event or check db
if 'app' in locals():
    print("App loaded. Checking routes...")
    for route in app.routes:
        print(f" - {route.path}")
