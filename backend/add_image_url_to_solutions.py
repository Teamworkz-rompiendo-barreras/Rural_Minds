import sqlite3

def fix():
    conn = sqlite3.connect('teamworkz.db')
    c = conn.cursor()
    
    try:
        c.execute("ALTER TABLE solutions ADD COLUMN image_url VARCHAR")
        print("✅ Added image_url to solutions")
    except Exception as e:
        print(f"⚠️ image_url: {e}")
    
    conn.commit()
    conn.close()
    print("Done.")

if __name__ == "__main__":
    fix()
