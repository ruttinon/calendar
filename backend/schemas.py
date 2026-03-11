from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# TODO SCHEMAS
class TodoBase(BaseModel):
    text: str
    date_str: str
    time_str: Optional[str] = None
    completed: bool = False

class TodoCreate(TodoBase):
    pass

class Todo(TodoBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True

# FOLDER SCHEMAS
class FolderBase(BaseModel):
    name: str
    order_index: int = 0

class FolderCreate(FolderBase):
    pass

class FolderUpdate(BaseModel):
    name: Optional[str] = None
    order_index: Optional[int] = None

class Folder(FolderBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True

# NOTE SCHEMAS
class NoteBase(BaseModel):
    title: str
    content: Optional[str] = ""
    date_str: str
    folder_id: Optional[int] = None

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    folder_id: Optional[int] = None

class Note(NoteBase):
    id: int
    created_at: Optional[datetime] = None
    owner_id: int

    class Config:
        orm_mode = True

# USER SCHEMAS
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    notes: List[Note] = []
    todos: List[Todo] = []

    class Config:
        orm_mode = True

# TEMPLATE SCHEMAS
class TemplateBase(BaseModel):
    title: str
    category: str
    price: float
    rating: float
    content: str

class Template(TemplateBase):
    id: int

    class Config:
        orm_mode = True
