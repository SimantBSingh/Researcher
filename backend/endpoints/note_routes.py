from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session

from models.schema import NoteCreate, NoteResponse, NoteUpdate
from utils.helper import can_write, get_current_user
from utils.sse_manager import sse_manager
from database import get_db
from models.UserModel import User
from models.ProjectModel import Project
from models.NotesModel import Note

router = APIRouter()


@router.post("/")
def create_note(
    new_note: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not new_note.content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Note content is missing")

    if not new_note.project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required")

    db_project = db.query(Project).filter(Project.id == new_note.project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not can_write(new_note.project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    note = Note(content=new_note.content, project_id=new_note.project_id)
    db.add(note)
    db.commit()
    db.refresh(note)
    sse_manager.emit(new_note.project_id, "notes_changed")
    return {"message": "Operation Successful", "last_inserted_id": note.id}


@router.get("/{project_id}/")
def get_notes(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required")

    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    notes = db.query(Note).filter(Note.project_id == project_id).all()
    return [NoteResponse(id=n.id, content=n.content, project_id=n.project_id) for n in notes]


@router.put("/{note_id}/")
def update_note(
    note_id: int,
    updated_note: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not note_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Note ID is required")

    db_project = db.query(Project).filter(Project.id == updated_note.project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not can_write(updated_note.project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    note.content = updated_note.content
    db.commit()
    sse_manager.emit(updated_note.project_id, "notes_changed")
    return {"message": "Operation Successful"}


@router.delete("/{note_id}/{project_id}")
def delete_note(
    note_id: int,
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not note_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Note ID is required")

    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not can_write(project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    db.delete(note)
    db.commit()
    sse_manager.emit(project_id, "notes_changed")
    return {"message": "Operation Successful"}
