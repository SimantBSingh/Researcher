import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import get_db

from models.UserModel import User
from models.CollaboratorModel import CollaboratorInviteDB, Collaborator
from models.EmailVerificationModel import EmailVerification
from models.schema import UserCreateWithVerification, UserLogin, UserInvite, UserUpdate, VerificationSend
from models.ProjectModel import Project, ProjectShare

from enums.access_level import AccessLevel

from utils.helper import get_password_hash, verify_password, create_access_token, get_current_user, send_verification_email
from config import Config


router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/send-verification")
def send_verification(data: VerificationSend, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Replace any existing pending code for this email
    db.query(EmailVerification).filter(EmailVerification.email == data.email).delete()
    db.add(EmailVerification(email=data.email, code=code, expires_at=expires_at))
    db.commit()

    if not send_verification_email(data.email, code):
        db.query(EmailVerification).filter(EmailVerification.email == data.email).delete()
        db.commit()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send verification email. Check your email configuration.")

    return {"message": "Verification code sent"}


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreateWithVerification, db: Session = Depends(get_db)):
    verification = db.query(EmailVerification).filter(
        EmailVerification.email == user.email,
        EmailVerification.used == False,
    ).first()

    if not verification:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No verification code found. Please request a new one.")

    if datetime.utcnow() > verification.expires_at.replace(tzinfo=None):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code has expired. Please request a new one.")

    if verification.code != user.verification_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code.")

    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    verification.used = True
    hashed_password = get_password_hash(user.password)
    new_user = User(
        name=user.name,
        institution=user.institution,
        position=user.position,
        zoom=user.zoom,
        email=user.email,
        hashed_password=hashed_password,
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": "Account created successfully! You can now sign in.", "user_id": new_user.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/signup/invite")
def signup_invite(user_data: UserInvite, db: Session = Depends(get_db)):
    try:
        invite = None
        if user_data.token:
            invite = db.query(CollaboratorInviteDB).filter(
                CollaboratorInviteDB.token == user_data.token,
                CollaboratorInviteDB.invitee_email == user_data.email,
                CollaboratorInviteDB.accepted == False,
            ).first()

            if not invite:
                raise HTTPException(status_code=400, detail="Invalid or already used invite token")

        if db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            name=user_data.name,
            institution=user_data.institution,
            position=user_data.position,
            zoom=user_data.zoom,
            email=user_data.email,
            hashed_password=hashed_password,
        )
        db.add(new_user)
        db.flush()

        if invite:
            project = db.query(Project).filter(Project.id == invite.project_id).first()
            if not project:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

            project_share = ProjectShare(
                project_id=invite.project_id,
                user_id=new_user.id,
                access_level=AccessLevel.READ,
            )
            db.add(project_share)

            collaborator = Collaborator(
                project_id=invite.project_id,
                user_id=new_user.id,
                name=new_user.name,
                title=new_user.position,
                email=new_user.email,
                zoomLink=new_user.zoom,
                institution=new_user.institution,
            )
            db.add(collaborator)

            project.is_shared = True
            invite.accepted = True

        db.commit()
        db.refresh(new_user)
        return {"message": "User created successfully", "user_id": new_user.id}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email or password")

    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email or password")

    access_token_expires = timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": db_user.email}, expires_delta=access_token_expires)

    return {
        "user": {
            "name": db_user.name,
            "email": db_user.email,
            "institution": db_user.institution,
            "position": db_user.position,
            "zoom": db_user.zoom,
        },
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/invite")
def verify_invite_token(token: str, db: Session = Depends(get_db)):
    try:
        invite = db.query(CollaboratorInviteDB).filter(
            CollaboratorInviteDB.token == token,
            CollaboratorInviteDB.accepted == False,
        ).first()

        if not invite:
            raise HTTPException(status_code=404, detail="Invalid or expired invite token")

        if invite.accepted:
            raise HTTPException(status_code=400, detail="Invite has already been accepted")

        return invite.invitee_email

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/profile", response_model=UserUpdate)
def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return UserUpdate(
        name=user.name,
        institution=user.institution,
        position=user.position,
        zoom=user.zoom,
        email=user.email,
    )
