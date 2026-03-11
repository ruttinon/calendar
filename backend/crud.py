from sqlalchemy.orm import Session
from typing import Optional
import models, schemas

# USER
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(email=user.email, username=user.username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# TODOS
def get_todos_by_date(db: Session, user_id: int, date_str: str):
    return db.query(models.Todo).filter(models.Todo.owner_id == user_id, models.Todo.date_str == date_str).all()

def create_todo(db: Session, todo: schemas.TodoCreate, user_id: int):
    db_todo = models.Todo(**todo.dict(), owner_id=user_id)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

def toggle_todo(db: Session, todo_id: int, user_id: int):
    todo = db.query(models.Todo).filter(models.Todo.id == todo_id, models.Todo.owner_id == user_id).first()
    if todo:
        todo.completed = not todo.completed
        db.commit()
        db.refresh(todo)
    return todo

def delete_todo(db: Session, todo_id: int, user_id: int):
    todo = db.query(models.Todo).filter(models.Todo.id == todo_id, models.Todo.owner_id == user_id).first()
    if todo:
        db.delete(todo)
        db.commit()
    return todo

# FOLDERS
def get_folders(db: Session, user_id: int):
    return db.query(models.Folder).filter(models.Folder.owner_id == user_id).order_by(models.Folder.order_index).all()

def create_folder(db: Session, folder: schemas.FolderCreate, user_id: int):
    db_folder = models.Folder(**folder.dict(), owner_id=user_id)
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

def update_folder(db: Session, folder_id: int, folder_update: schemas.FolderUpdate, user_id: int):
    db_folder = db.query(models.Folder).filter(models.Folder.id == folder_id, models.Folder.owner_id == user_id).first()
    if db_folder:
        update_data = folder_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_folder, key, value)
        db.commit()
        db.refresh(db_folder)
    return db_folder

def delete_folder(db: Session, folder_id: int, user_id: int):
    db_folder = db.query(models.Folder).filter(models.Folder.id == folder_id, models.Folder.owner_id == user_id).first()
    if db_folder:
        # Notes in this folder become unassigned
        db.query(models.Note).filter(models.Note.folder_id == folder_id).update({"folder_id": None})
        db.delete(db_folder)
        db.commit()
    return db_folder

# NOTES
def get_notes_by_date(db: Session, user_id: int, date_str: str):
    return db.query(models.Note).filter(models.Note.owner_id == user_id, models.Note.date_str == date_str).all()
def get_notes_by_folder(db: Session, user_id: int, folder_id: int):
    return db.query(models.Note).filter(models.Note.owner_id == user_id, models.Note.folder_id == folder_id).all()

def get_recent_notes(db: Session, user_id: int, limit: int = 5):
    from sqlalchemy import nullslast, desc
    return (
        db.query(models.Note)
        .filter(models.Note.owner_id == user_id)
        .order_by(nullslast(desc(models.Note.created_at)))
        .limit(limit)
        .all()
    )

def create_note(db: Session, note: schemas.NoteCreate, user_id: int):
    db_note = models.Note(**note.dict(), owner_id=user_id)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

def update_note(db: Session, note_id: int, note_update: schemas.NoteUpdate, user_id: int):
    db_note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.owner_id == user_id).first()
    if db_note:
        update_data = note_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_note, key, value)
        db.commit()
        db.refresh(db_note)
    return db_note

def delete_note(db: Session, note_id: int, user_id: int):
    note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.owner_id == user_id).first()
    if note:
        db.delete(note)
        db.commit()
    return note

def update_note_folder(db: Session, note_id: int, folder_id: Optional[int], user_id: int):
    note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.owner_id == user_id).first()
    if note:
        note.folder_id = folder_id
        db.commit()
        db.refresh(note)
    return note

# TEMPLATES
def get_templates(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Template).offset(skip).limit(limit).all()
