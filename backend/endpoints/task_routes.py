from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session

from utils.helper import can_write, get_current_user
from utils.sse_manager import sse_manager
from database import get_db
from models.UserModel import User
from models.ProjectModel import Project
from models.TaskModel import Task
from models.schema import TaskCreate, TaskSchema, TaskUpdateRequest

router = APIRouter()


@router.post("/")
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not task.title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")

    if not task.project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required")

    db_project = db.query(Project).filter(Project.id == task.project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not can_write(task.project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    new_task = Task(title=task.title, status=task.status, project_id=task.project_id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    sse_manager.emit(task.project_id, "tasks_changed")
    return {"message": "Operation Successful", "last_inserted_id": new_task.id}


@router.get("/{project_id}/")
def get_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required")

    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    return [TaskSchema(id=t.id, title=t.title, status=t.status, project_id=t.project_id) for t in tasks]


@router.put("/{task_id}/")
def update_task(
    task_id: int,
    task_update_request: TaskUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not task_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Task ID is required")

    db_project = db.query(Project).filter(Project.id == task_update_request.project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if not can_write(task_update_request.project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if task_update_request.title:
        task.title = task_update_request.title
    if task_update_request.task_status:
        task.status = task_update_request.task_status

    db.commit()
    sse_manager.emit(task_update_request.project_id, "tasks_changed")
    return {"message": "Operation Successful"}


@router.delete("/{task_id}/{project_id}")
def delete_task(
    task_id: int,
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not task_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Task ID is required")

    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if not can_write(project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    db.delete(task)
    db.commit()
    sse_manager.emit(project_id, "tasks_changed")
    return {"message": "Operation Successful"}
