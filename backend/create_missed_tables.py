from database import engine
import models

def create():
    print("Creating missing tables in teamworkz.db...")
    models.Base.metadata.create_all(bind=engine)
    print("✅ Done.")

if __name__ == "__main__":
    create()
