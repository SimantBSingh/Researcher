from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session
from dateutil import parser as datetimeParser

from utils.helper import can_write, get_current_user
from utils.sse_manager import sse_manager
from database import get_db
from models.UserModel import User
from models.ProjectModel import Project
from models.DeadlineModel import Deadline
from models.schema import DeadlineCreate, DeadlineSchema, DeadlineUpdate

router = APIRouter()


@router.post("/")
def create_deadline(
    deadline: DeadlineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not deadline or not deadline.name or not deadline.datetime:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name and datetime are required")

    if not deadline.project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required")

    db_project = db.query(Project).filter(Project.id == deadline.project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not can_write(deadline.project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    python_datetime = datetimeParser.parse(deadline.datetime)
    new_deadline = Deadline(
        name=deadline.name,
        datetime=python_datetime,
        location=deadline.location,
        project_id=deadline.project_id,
    )
    db.add(new_deadline)
    db.commit()
    db.refresh(new_deadline)
    sse_manager.emit(deadline.project_id, "deadlines_changed")
    return {"message": "Operation Successful", "last_inserted_id": new_deadline.id}


@router.get("/{project_id}/")
def get_deadlines(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required")

    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    deadlines = db.query(Deadline).filter(Deadline.project_id == project_id).all()
    return [
        DeadlineSchema(
            id=d.id,
            name=d.name,
            location=d.location,
            project_id=d.project_id,
            datetime=str(d.datetime),
        )
        for d in deadlines
    ]


@router.put("/{deadline_id}/")
def update_deadline(
    deadline_id: int,
    deadline_update: DeadlineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not deadline_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Deadline ID is required")

    db_project = db.query(Project).filter(Project.id == deadline_update.project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not can_write(deadline_update.project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    deadline = db.query(Deadline).filter(Deadline.id == deadline_id).first()
    if not deadline:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deadline not found")

    deadline.name = deadline_update.name
    deadline.location = deadline_update.location
    deadline.datetime = datetimeParser.parse(deadline_update.datetime)
    db.commit()
    sse_manager.emit(deadline_update.project_id, "deadlines_changed")
    return {"message": "Operation Successful"}


@router.delete("/{deadline_id}/{project_id}")
def delete_deadline(
    deadline_id: int,
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not deadline_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Deadline ID is required")

    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not can_write(project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    deadline = db.query(Deadline).filter(Deadline.id == deadline_id).first()
    if not deadline:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deadline not found")

    db.delete(deadline)
    db.commit()
    sse_manager.emit(project_id, "deadlines_changed")
    return {"message": "Operation Successful"}
