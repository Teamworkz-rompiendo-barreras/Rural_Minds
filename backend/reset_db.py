import models
import database
from database import engine

def reset_database():
    print("⚠️  Reseting Database (DROP ALL TABLES)...")
    models.Base.metadata.drop_all(bind=engine)
    print("✅  Tables Dropped.")
    
    print("🌱 Creating All Tables...")
    models.Base.metadata.create_all(bind=engine)
    print("✅  Tables Created.")

if __name__ == "__main__":
    reset_database()
