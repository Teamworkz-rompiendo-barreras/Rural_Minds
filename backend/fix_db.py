import sqlite3

def fix():
    conn = sqlite3.connect('teamworkz.db')
    c = conn.cursor()
    try:
        print("Adding invited_by_org_id to invitations...")
        c.execute("ALTER TABLE invitations ADD COLUMN invited_by_org_id CHAR(32)")
        conn.commit()
        print("✅ Column added.")
    except Exception as e:
        print(f"⚠️ Error (maybe exists?): {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix()
