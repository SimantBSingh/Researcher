from fastapi import APIRouter, Depends, status, HTTPException

from sqlalchemy.orm import Session
from typing import List, Dict, Any

from utils.helper import isUserAdmin, can_write, get_current_user, remove_collaborator_from_project, share_and_invite_collaborator
from utils.sse_manager import sse_manager

from models.UserModel import User
from models.ProjectModel import Project, ProjectShare
from models.TemplateModel import Template, TemplateFolder
from models.schema import ProjectCreate, ProjectNameUpdate, ProjectSchema, ProjectShareUpdate, ProjectShareSchema, SharedUser

from database import get_db
from enums.access_level import AccessLevel


router = APIRouter()


@router.post("/", response_model=ProjectSchema)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        db_template = db.query(Template).filter(Template.name == project.template_name).first()

        db_project = Project(
            name=project.name,
            owner_id=current_user.id,
        )

        if db_template:
            db_project.template_id = db_template.id

        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        return db_project

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")


@router.get("/", response_model=List[ProjectSchema])
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if isUserAdmin(current_user):
        return db.query(Project).all()
    return db.query(Project).filter(Project.owner_id == current_user.id).all()


@router.get("/admin", response_model=Dict[str, List[Dict[str, Any]]])
def get_projects_by_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not isUserAdmin(current_user):
        raise HTTPException(status_code=403, detail="Only admin can access all users' projects")

    users = {user.id: user for user in db.query(User).all()}
    projects = db.query(Project).all()

    grouped_projects: Dict[str, List[Dict[str, Any]]] = {}
    for project in projects:
        project_owner = users.get(project.owner_id)
        user_key = f"{project_owner.name} ({project_owner.email})" if project_owner else f"Unknown User (ID: {project.owner_id})"
        if user_key not in grouped_projects:
            grouped_projects[user_key] = []
        grouped_projects[user_key].append({
            "id": project.id,
            "name": project.name,
            "template_id": project.template_id,
            "created_at": project.created_at,
        })

    return grouped_projects


@router.get("/shared", response_model=List[ProjectSchema])
def get_shared_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_shared_projects = db.query(ProjectShare).filter(ProjectShare.user_id == current_user.id).all()
    shared_projects = []
    for db_shared_project in db_shared_projects:
        shared_project = db.query(Project).filter(
            Project.is_shared == True,
            Project.id == db_shared_project.project_id,
        ).all()
        shared_projects.extend(shared_project)
    return shared_projects


@router.get("/shared_users/{project_id}", response_model=List[SharedUser])
def get_shared_users(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=400, detail="Project ID is required")

    shared_users_of_project = db.query(ProjectShare).filter(ProjectShare.project_id == project_id).all()
    user_ids = [s.user_id for s in shared_users_of_project]
    users = db.query(User).filter(User.id.in_(user_ids)).all()

    return [
        {
            'name': user.name,
            'email': user.email,
            'institution': user.institution,
            'position': user.position,
            'zoom': user.zoom,
            'access_level': next(
                (s.access_level for s in shared_users_of_project if s.user_id == user.id),
                None,
            ),
        }
        for user in users
    ]


@router.get("/as_folder/{project_id}", response_model=ProjectSchema)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/access_level/{project_id}")
def get_project_access_level(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not isUserAdmin(current_user) and project.owner_id != current_user.id:
        share_access = db.query(ProjectShare).filter(
            ProjectShare.project_id == project_id,
            ProjectShare.user_id == current_user.id,
        ).first()
        if not share_access:
            raise HTTPException(status_code=403, detail="Unauthorized access")
        return share_access.access_level

    return AccessLevel.ADMIN


@router.put("/{project_id}/rename", response_model=dict)
def rename_project(
    project_id: int,
    project_update: ProjectNameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not can_write(project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    project.name = project_update.new_name
    db.commit()
    return {"message": "Project renamed successfully"}


@router.put("/{project_id}/share")
async def share_project(
    project_id: int,
    share_data: ProjectShareSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required")

    if not share_data or not share_data.user_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required")

    return await share_and_invite_collaborator(project_id, share_data.user_email, share_data.access_level, db, current_user)


@router.delete("/{project_id}/delete_shared_users", response_model=dict)
async def delete_share_project(
    project_id: int,
    share_data: ProjectShareSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await remove_collaborator_from_project(project_id, share_data.user_email, db, current_user)


@router.put("/{project_id}/access_level", response_model=dict)
def update_project_access_level(
    project_id: int,
    project_access_level: ProjectShareUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not isUserAdmin(current_user) and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only project owner can update access level")

    user = db.query(User).filter(User.email == project_access_level.shared_user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Shared User not found")

    project_share = db.query(ProjectShare).filter(
        ProjectShare.user_id == user.id,
        ProjectShare.project_id == project_id,
    ).first()
    if not project_share:
        raise HTTPException(status_code=404, detail="Project not shared with the provided user")

    project_share.access_level = AccessLevel(project_access_level.access_level)
    db.commit()
    sse_manager.emit_to_user(user.id, "projects_changed")
    return {"message": "Access level updated"}


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not isUserAdmin(current_user) and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only Project owner can delete this project")

    shared_user_ids = [
        s.user_id for s in db.query(ProjectShare).filter(ProjectShare.project_id == project_id).all()
    ]

    try:
        db.delete(project)
        db.commit()
        for uid in shared_user_ids:
            sse_manager.emit_to_user(uid, "project_deleted", project_id=project_id)
        return {"message": "Project deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting project: {str(e)}")
