from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base 
from enums.access_level import AccessLevel


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    template_id = Column(Integer, ForeignKey('templates.id'))
    owner_id = Column(Integer, ForeignKey("users.id"))
    is_shared = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    template = relationship("Template", back_populates="projects")
    owner = relationship("User", back_populates="owned_projects")
    shared_with = relationship("ProjectShare", cascade="all, delete-orphan")
    


class ProjectShare(Base):
    __tablename__ = "project_shares"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    access_level = Column(Enum(AccessLevel))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    
# class ProjectMember(Base):
#     __tablename__ = "project_members"
    
#     id = Column(Integer, primary_key=True, index=True)
#     project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
#     user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
#     role = Column(String, default='member')  # Could be 'owner', 'member', 'viewer', etc.
#     joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
#     # Relationships
#     project = relationship("Project", back_populates="members")
#     user = relationship("User")
