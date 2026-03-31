from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session

from enums.access_level import AccessLevel
from utils.helper import can_write, get_current_user, remove_collaborator_from_project, share_and_invite_collaborator
from utils.sse_manager import sse_manager
from database import get_db
from models.UserModel import User
from models.ProjectModel import Project, ProjectShare
from models.CollaboratorModel import Collaborator
from models.schema import CollaboratorInvite, CollaboratorSchema

router = APIRouter()


@router.post("/")
async def create_collaborator(
    collaborator: CollaboratorSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not collaborator or not collaborator.name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Collaborator details are required")

    if not collaborator.project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required")

    db_project = db.query(Project).filter(Project.id == collaborator.project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not can_write(collaborator.project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    existing = db.query(Collaborator).filter(
        Collaborator.project_id == collaborator.project_id,
        Collaborator.email == collaborator.email,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A collaborator with this email already exists in the project")

    existing_user = db.query(User).filter(User.email == collaborator.email).first()
    if existing_user:
        return await share_and_invite_collaborator(collaborator.project_id, existing_user.email, AccessLevel.READ, db, current_user)

    new_collab = Collaborator(
        project_id=collaborator.project_id,
        name=collaborator.name,
        title=collaborator.title or "",
        zoomLink=collaborator.zoom_link,
        email=collaborator.email,
        institution=collaborator.institution,
    )
    db.add(new_collab)
    db.commit()
    db.refresh(new_collab)
    sse_manager.emit(collaborator.project_id, "collaborators_changed")
    return {"message": "Operation Successful", "last_inserted_id": new_collab.id}


@router.post("/invite")
async def invite_user(
    invite_request: CollaboratorInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not invite_request or not invite_request.project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required")

    if not invite_request or not invite_request.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required")

    return await share_and_invite_collaborator(invite_request.project_id, invite_request.email, AccessLevel.READ, db, current_user)


@router.get("/{project_id}/")
def get_collaborators(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required")

    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    collaborators = db.query(Collaborator).filter(Collaborator.project_id == project_id).all()
    return [
        CollaboratorSchema(
            id=c.id,
            name=c.name,
            title=c.title,
            institution=c.institution,
            project_id=c.project_id,
            email=c.email,
            zoom_link=c.zoomLink,
        )
        for c in collaborators
    ]


@router.get("/all/{project_id}/")
def get_all_collaborators(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required")

    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Deduplicate by email (keep lowest id per email)
    seen_emails = set()
    result = []
    collaborators = db.query(Collaborator).order_by(Collaborator.id).all()
    for c in collaborators:
        if c.email not in seen_emails:
            seen_emails.add(c.email)
            result.append({
                'id': c.id,
                'name': c.name,
                'title': c.title,
                'institution': c.institution,
                'email': c.email,
                'zoom_link': c.zoomLink,
                'user_id': c.user_id,
            })
    return result


@router.put("/correct/{project_id}")
def clean_duplicate_collaborators(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = db.query(Project).all()
    updated_count = 0
    processed_count = 0
    errors = []

    for project in projects:
        try:
            collaborators = db.query(Collaborator).filter(
                Collaborator.project_id == project.id,
                Collaborator.email.isnot(None),
            ).all()

            for collab in collaborators:
                processed_count += 1
                user = db.query(User).filter(User.email == collab.email).first()
                if user:
                    collab.name = user.name
                    collab.title = user.position
                    collab.zoomLink = user.zoom
                    collab.institution = user.institution
                    collab.user_id = user.id
                    updated_count += 1

                    shared = db.query(ProjectShare).filter(
                        ProjectShare.user_id == user.id,
                        ProjectShare.project_id == project.id,
                    ).first()
                    if not shared:
                        db.add(ProjectShare(project_id=project.id, user_id=user.id, access_level=AccessLevel.READ))
                        project.is_shared = True

            db.commit()
        except Exception as e:
            db.rollback()
            errors.append(f"Error processing project {project.id}: {str(e)}")

    return {"processed": processed_count, "updated": updated_count, "errors": errors}


@router.put("/{collaborator_id}/")
def update_collaborator(
    collaborator_id: int,
    collaborator_update: CollaboratorSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not collaborator_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Collaborator ID is required")

    db_project = db.query(Project).filter(Project.id == collaborator_update.project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not can_write(collaborator_update.project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    existing = db.query(Collaborator).filter(
        Collaborator.project_id == collaborator_update.project_id,
        Collaborator.email == collaborator_update.email,
        Collaborator.id != collaborator_id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A collaborator with this email already exists in the project")

    collab = db.query(Collaborator).filter(Collaborator.id == collaborator_id).first()
    if not collab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collaborator not found")

    collab.name = collaborator_update.name
    collab.title = collaborator_update.title
    collab.zoomLink = collaborator_update.zoom_link
    collab.email = collaborator_update.email
    db.commit()
    sse_manager.emit(collaborator_update.project_id, "collaborators_changed")
    return {"message": "Operation Successful"}


@router.delete("/{collaborator_email}/{project_id}")
async def delete_collaborator(
    collaborator_email: str,
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required")

    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not can_write(project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    if not collaborator_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Collaborator email is required")

    await remove_collaborator_from_project(project_id, collaborator_email, db, current_user)
    sse_manager.emit(project_id, "collaborators_changed")
    return {"message": "Shared Project deleted from user"}
