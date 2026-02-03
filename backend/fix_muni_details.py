import sqlite3

def fix():
    conn = sqlite3.connect('teamworkz.db')
    c = conn.cursor()
    
    # Columns to add to municipality_details
    columns = [
        ("status", "VARCHAR DEFAULT 'draft'"),
        ("internet_speed", "VARCHAR"),
        ("connectivity_info", "VARCHAR"),
        ("climate_co2", "VARCHAR"),
        ("services", "TEXT DEFAULT '{}'"),
        ("gallery_urls", "TEXT DEFAULT '[]'"),
        ("description", "VARCHAR")
    ]
    
    for col_name, col_type in columns:
        try:
            c.execute(f"ALTER TABLE municipality_details ADD COLUMN {col_name} {col_type}")
            print(f"✅ Added {col_name}")
        except Exception as e:
            print(f"⚠️ {col_name}: {e}")
    
    conn.commit()
    conn.close()
    print("Done.")

if __name__ == "__main__":
    fix()
