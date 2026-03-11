from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas, crud
from database import SessionLocal, engine, get_db

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Daily Workspace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to create a dummy user and templates if empty
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    user = crud.get_user(db, user_id=1)
    if not user:
        crud.create_user(db, schemas.UserCreate(username="ratthinon", email="test@example.com"))
    
    # Create default folders
    folders = crud.get_folders(db, user_id=1)
    if not folders:
        crud.create_folder(db, schemas.FolderCreate(name="Work", order_index=0), user_id=1)
        crud.create_folder(db, schemas.FolderCreate(name="Study", order_index=1), user_id=1)
        crud.create_folder(db, schemas.FolderCreate(name="Personal", order_index=2), user_id=1)

    templates = crud.get_templates(db)
    if not templates:
        db.add(models.Template(title="Student Planner", category="Study", price=3.0, rating=4.8, content="{}"))
        db.add(models.Template(title="Meeting Notes", category="Work", price=0.0, rating=4.5, content="{}"))
        db.commit()
    db.close()


@app.get("/")
def read_root():
    return {"message": "Daily Workspace API running on port 8000"}

# --- TODOS --- 
@app.get("/todos/{date_str}", response_model=List[schemas.Todo])
def read_todos_by_date(date_str: str, db: Session = Depends(get_db)):
    return crud.get_todos_by_date(db, user_id=1, date_str=date_str)

@app.post("/todos/", response_model=schemas.Todo)
def create_todo(todo: schemas.TodoCreate, db: Session = Depends(get_db)):
    return crud.create_todo(db, todo, user_id=1)

@app.put("/todos/{todo_id}/toggle", response_model=schemas.Todo)
def toggle_todo(todo_id: int, db: Session = Depends(get_db)):
    todo = crud.toggle_todo(db, todo_id, user_id=1)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo

@app.put("/todos/{todo_id}", response_model=schemas.Todo)
def update_todo(todo_id: int, todo_update: schemas.TodoCreate, db: Session = Depends(get_db)):
    # Simple workaround using similar update logic or just rewriting
    todo = db.query(models.Todo).filter(models.Todo.id == todo_id, models.Todo.owner_id == 1).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    todo.text = todo_update.text
    if todo_update.time_str is not None:
        todo.time_str = todo_update.time_str
    db.commit()
    db.refresh(todo)
    return todo

@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    todo = crud.delete_todo(db, todo_id, user_id=1)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"ok": True}

# --- NOTES ---
# IMPORTANT: /notes/recent/ must be registered BEFORE /notes/{date_str}
# otherwise FastAPI matches "recent" as a date_str path param.
@app.get("/notes/recent/", response_model=List[schemas.Note])
def read_recent_notes(limit: int = 5, db: Session = Depends(get_db)):
    return crud.get_recent_notes(db, user_id=1, limit=limit)

@app.get("/notes/{date_str}", response_model=List[schemas.Note])
def read_notes_by_date(date_str: str, db: Session = Depends(get_db)):
    return crud.get_notes_by_date(db, user_id=1, date_str=date_str)
@app.get("/notes/folder/{folder_id}", response_model=List[schemas.Note])
def read_notes_by_folder(folder_id: int, db: Session = Depends(get_db)):
    return crud.get_notes_by_folder(db, user_id=1, folder_id=folder_id)

@app.post("/notes/", response_model=schemas.Note)
def create_note(note: schemas.NoteCreate, db: Session = Depends(get_db)):
    return crud.create_note(db, note, user_id=1)

@app.put("/notes/{note_id}", response_model=schemas.Note)
def update_note(note_id: int, note_update: schemas.NoteUpdate, db: Session = Depends(get_db)):
    note = crud.update_note(db, note_id, note_update, user_id=1)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@app.put("/notes/{note_id}/move/{folder_id}", response_model=schemas.Note)
def move_note_to_folder(note_id: int, folder_id: int, db: Session = Depends(get_db)):
    # Use 0 as a special value for "No folder" if needed, or handle null via optional
    f_id = folder_id if folder_id > 0 else None
    note = crud.update_note_folder(db, note_id, f_id, user_id=1)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@app.delete("/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = crud.delete_note(db, note_id, user_id=1)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"ok": True}

# --- FOLDERS ---
@app.get("/folders/", response_model=List[schemas.Folder])
def read_folders(db: Session = Depends(get_db)):
    return crud.get_folders(db, user_id=1)

@app.post("/folders/", response_model=schemas.Folder)
def create_folder(folder: schemas.FolderCreate, db: Session = Depends(get_db)):
    return crud.create_folder(db, folder, user_id=1)

@app.put("/folders/{folder_id}", response_model=schemas.Folder)
def update_folder(folder_id: int, folder_update: schemas.FolderUpdate, db: Session = Depends(get_db)):
    folder = crud.update_folder(db, folder_id, folder_update, user_id=1)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder

@app.delete("/folders/{folder_id}")
def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    folder = crud.delete_folder(db, folder_id, user_id=1)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"ok": True}

# --- TEMPLATES ---
@app.get("/templates/", response_model=List[schemas.Template])
def read_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_templates(db, skip=skip, limit=limit)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
