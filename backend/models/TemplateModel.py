from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base 
from sqlalchemy.sql import func


class Template(Base):
    __tablename__ = 'templates'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # # Relationships
    projects = relationship("Project", back_populates="template")
    template_folders = relationship("TemplateFolder", back_populates="template", cascade="all, delete-orphan")


class TemplateFolder(Base):
    __tablename__ = 'template_folders'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    
    # Relationship
    template = relationship("Template", back_populates="template_folders")