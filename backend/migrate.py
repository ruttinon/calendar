"""
Migration script to add missing columns to the notes table in daily_workspace_v2.db
Run this once: python migrate.py
"""
import sqlite3

conn = sqlite3.connect("daily_workspace_v2.db")
cursor = conn.cursor()

# Check existing columns
cursor.execute("PRAGMA table_info(notes)")
cols = {row[1] for row in cursor.fetchall()}
print("Existing notes columns:", cols)

added = []

if "folder_id" not in cols:
    cursor.execute("ALTER TABLE notes ADD COLUMN folder_id INTEGER REFERENCES folders(id)")
    added.append("folder_id")

if "created_at" not in cols:
    cursor.execute("ALTER TABLE notes ADD COLUMN created_at DATETIME")
    added.append("created_at")

conn.commit()
conn.close()

if added:
    print("Added columns:", added)
else:
    print("No columns needed to be added — schema already up to date.")
