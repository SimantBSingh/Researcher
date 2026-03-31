from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from database import Base
from sqlalchemy.sql import func


class Collaborator(Base):
    __tablename__ = 'collaborators'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    zoomLink = Column(String)
    email = Column(String, nullable=False)
    institution = Column(String)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class CollaboratorInviteDB(Base):
    __tablename__ = "collaborator_invites"

    id = Column(Integer, primary_key=True)
    invitee_email = Column(String, nullable=False)
    inviter_email = Column(String, nullable=False)
    project_id = Column(Integer, nullable=False)
    token = Column(String, nullable=False)
    accepted = Column(Boolean, default=False)
