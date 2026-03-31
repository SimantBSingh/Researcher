from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session
from typing import List
# from datetime import datetime

from models.TemplateModel import Template, TemplateFolder

# from models.FolderModel import Folder
from models.UserModel import User
from models.schema import TemplateCreate, TemplateSchema, TemplateUpdate

from database import get_db
from utils.helper import get_current_user
# import shutil

router = APIRouter()

from typing import List
from sqlalchemy.orm import Session
        

@router.post("/", response_model=TemplateSchema)
def create_template(
    template: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get the template first
    existing_template_name = db.query(Template).filter(Template.name == template.name).first()

    if existing_template_name:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Template name already exists")
        
    
    db_template = Template(
        name=template.name,
    )
    db.add(db_template)
    db.flush()  # Flush to get template ID
        
    
    # Create the folder structure
    for folder_name in template.folders:
        template_folder = TemplateFolder(
            name=folder_name,
            template_id=db_template.id 
        )
        db.add(template_folder)
            
    
    db.commit()
    db.refresh(db_template)
    return db_template

# @router.get("/folders", response_model=List[TemplateSchema])
def get_template_folders(
    template_id: int,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
):
    template_folders = db.query(TemplateFolder).filter(
        TemplateFolder.template_id == template_id,
    ).all()
    return template_folders

@router.get("/", response_model=List[TemplateSchema])
def get_templates(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):    
    db_templates = db.query(Template).all()
    
    templates = []
    for db_template in db_templates:
        template_folders = get_template_folders(db_template.id, db)
        template = {
            'id': db_template.id,
            'name': db_template.name,
            'created_at': db_template.created_at,
            'folders': template_folders,
        }
        templates.append(template)
    
    # return {"templates": templates, "status": 200}
    return templates


@router.get("id/{template_id}", response_model=TemplateSchema)
def get_template(   
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template

@router.get("/name/{template_name}", response_model=TemplateSchema)
def get_template(
    template_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_template = db.query(Template).filter(Template.name == template_name).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    templates = []
    # for db_template in db_templates:
    template_folders = get_template_folders(db_template.id, db)
    template = {
        'id': db_template.id,
        'name': db_template.name,
        'created_at': db_template.created_at,
        'folders': template_folders,
    }
    templates.append(template)
    
    
    return template


@router.put("/{template_name}", response_model=TemplateSchema)
def update_template(
    template_name: str,
    template_data: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    # Find existing template
    existing_template = db.query(Template).filter(
        Template.name == template_data.originalName, 
    ).first()
    
    if not existing_template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Update template name
    existing_template.name = template_data.toBeEditedName
    
    # Create a set of folder IDs from the update data for efficient lookup
    template_existing_folder_ids = {folder.id for folder in existing_template.template_folders}
    template_updated_folder_ids = {folder.id for folder in template_data.folders}
    
    # Handle deletions
    for template_folder_id in template_existing_folder_ids - template_updated_folder_ids:
        template_folder_to_delete = db.query(TemplateFolder).get(template_folder_id)
        if template_folder_to_delete:
            db.delete(template_folder_to_delete)
    
    # Handle updates and creations
    for template_folder in template_data.folders:
        if template_folder.id != 0:
            # Update existing folder
            existing_folder = db.query(TemplateFolder).filter(
                TemplateFolder.id == template_folder.id,
                TemplateFolder.template_id == existing_template.id
            ).first()
            if existing_folder:
                existing_folder.name = template_folder.name
        else:
            # Create new folder
            new_template_folder = TemplateFolder(
                name=template_folder.name,
                template_id=existing_template.id
            )
            db.add(new_template_folder)
    
    db.commit()
    db.refresh(existing_template)
    
    return existing_template
        

@router.delete("/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}