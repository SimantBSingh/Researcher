from fastapi import Depends, HTTPException, status
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt

from enums.access_level import AccessLevel
from config import Config
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models.schema import TokenData
import base64
import re
import requests
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build

from models.UserModel import User
from models.ProjectModel import Project, ProjectShare
from models.CollaboratorModel import CollaboratorInviteDB, Collaborator
from utils.sse_manager import sse_manager


def writeAccess(access):
    return access in (AccessLevel.WRITE, AccessLevel.ADMIN)


def readAccess(access):
    return access in (AccessLevel.READ, AccessLevel.WRITE, AccessLevel.ADMIN)


def isUserAdmin(current_user: User):
    return current_user.email == "unoairlab@gmail.com"


def can_write(project_id: int, current_user: User, db: Session):
    if not isUserAdmin(current_user):
        db_project = db.query(Project).filter(Project.id == project_id).first()
        if db_project.owner_id != current_user.id:
            db_shared_project = db.query(ProjectShare).filter(
                ProjectShare.project_id == project_id,
                ProjectShare.user_id == current_user.id,
            ).first()
            if not db_shared_project:
                return False
            if not writeAccess(db_shared_project.access_level):
                return False
    return True


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta if expires_delta else datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, Config.SESSION_SECRET_KEY, algorithm=Config.ALGORITHM)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, Config.SESSION_SECRET_KEY, algorithms=[Config.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user


def extract_arxiv_id(url):
    match = re.search(r'arxiv\.org/pdf/([0-9]+\.[0-9]+)(v[0-9]+)?', url)
    if match:
        return match.group(1)
    return None


def fetch_arxiv_title(arxiv_id):
    ARXIV_API_URL = "http://export.arxiv.org/api/query?id_list="
    response = requests.get(f"{ARXIV_API_URL}{arxiv_id}")
    if response.status_code == 200:
        xml_content = response.text
        start = xml_content.find('<title>') + 7
        end = xml_content.find('</title>', start)
        return xml_content[start:end].strip()
    return None


def _build_gmail_service():
    """Build an authenticated Gmail API service using stored OAuth2 credentials."""
    creds = Credentials(
        token=None,
        refresh_token=Config.GOOGLE_REFRESH_TOKEN,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=Config.GOOGLE_CLIENT_ID,
        client_secret=Config.GOOGLE_CLIENT_SECRET,
        scopes=["https://www.googleapis.com/auth/gmail.send"],
    )
    creds.refresh(GoogleRequest())
    return build("gmail", "v1", credentials=creds)


def _send_email(to: str, subject: str, body: str) -> bool:
    """Send an email via the Gmail API. Returns True on success."""
    try:
        message = MIMEMultipart()
        message["to"] = to
        message["from"] = Config.EMAIL
        message["subject"] = subject
        message.attach(MIMEText(body, "plain"))

        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        service = _build_gmail_service()
        service.users().messages().send(userId="me", body={"raw": raw}).execute()
        return True
    except Exception as error:
        print(f"Gmail API error: {error}")
        return False


def send_verification_email(email: str, code: str) -> bool:
    subject = "Your Verification Code"
    body = (
        f"Your verification code is:\n\n"
        f"  {code}\n\n"
        f"Enter this code on the sign-up page to complete your registration.\n"
        f"It expires in 10 minutes.\n\n"
        f"If you did not request this, you can safely ignore this email."
    )
    return _send_email(email, subject, body)


def send_invite_email(email: str, token: str) -> bool:
    invite_link = f"{Config.FRONTEND_URL}/signup?token={token}"
    subject = "Collaborator Invitation"
    body = f"Click to accept the collaborator invite: {invite_link}"
    return _send_email(email, subject, body)


async def share_and_invite_collaborator(
    project_id: int,
    invitee_email: str,
    access_level: AccessLevel,
    db: Session,
    current_user: User,
):
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        if not isUserAdmin(current_user) and project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only project owner can share the project",
            )

        existing_collab = db.query(Collaborator).filter(
            Collaborator.project_id == project_id,
            Collaborator.email == invitee_email,
        ).first()
        if existing_collab:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A collaborator with this email already exists in the project",
            )

        existing_user = db.query(User).filter(User.email == invitee_email).first()
        if not existing_user:
            token = secrets.token_urlsafe(32)
            db_invite = CollaboratorInviteDB(
                invitee_email=invitee_email,
                inviter_email=current_user.email,
                project_id=project_id,
                token=token,
            )
            db.add(db_invite)
            db.commit()

            email_sent = send_invite_email(invitee_email, token)
            if not email_sent:
                db.delete(db_invite)
                db.commit()
                raise HTTPException(status_code=500, detail="Failed to send invite email")

            return {"message": "Invite sent successfully"}

        project_share = ProjectShare(
            project_id=project_id,
            user_id=existing_user.id,
            access_level=access_level,
        )
        db.add(project_share)

        collaborator = Collaborator(
            project_id=project_id,
            user_id=existing_user.id,
            name=existing_user.name,
            title=existing_user.position,
            email=existing_user.email,
            zoomLink=existing_user.zoom,
            institution=existing_user.institution,
        )
        db.add(collaborator)

        project.is_shared = True
        db.commit()

        sse_manager.emit_to_user(existing_user.id, "projects_changed")
        return {"message": "Project shared and collaborator invited successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sharing project and inviting collaborator: {str(e)}",
        )


async def remove_collaborator_from_project(
    project_id: int,
    invite_email: str,
    db: Session,
    current_user: User,
):
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        if not isUserAdmin(current_user) and project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only project owner can remove collaborators",
            )

        shared_user = db.query(User).filter(User.email == invite_email).first()
        if shared_user:
            project_share = db.query(ProjectShare).filter(
                ProjectShare.project_id == project_id,
                ProjectShare.user_id == shared_user.id,
            ).first()
            if not project_share:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Collaborator is not part of the project",
                )
            db.delete(project_share)

        db.query(Collaborator).filter(
            Collaborator.project_id == project_id,
            Collaborator.email == invite_email,
        ).delete()

        db.commit()

        if not db.query(ProjectShare).filter(ProjectShare.project_id == project_id).first():
            project.is_shared = False
            db.commit()

        if shared_user:
            sse_manager.emit_to_user(shared_user.id, "access_revoked", project_id=project_id)

        return {"message": "Collaborator removed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing collaborator: {str(e)}",
        )
