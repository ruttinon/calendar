from database import SessionLocal
import crud

db = SessionLocal()
try:
    notes = crud.get_recent_notes(db, user_id=1, limit=5)
    for n in notes:
        print(n.id, n.title, n.created_at)
except Exception as e:
    import traceback
    traceback.print_exc()
