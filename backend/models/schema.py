from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enums.access_level import AccessLevel

class VerificationSend(BaseModel):
    email: EmailStr

class UserCreate(BaseModel):
    name: str
    institution: str
    position: str
    zoom: str
    email: EmailStr
    password: str

class UserCreateWithVerification(UserCreate):
    verification_code: str
    
class UserUpdate(BaseModel):
    name: Optional[str] = None
    institution: Optional[str] = None
    position: Optional[str] = None
    zoom: Optional[str] = None
    email: Optional[EmailStr]
    
class SharedUser(BaseModel):
    name: str
    email: EmailStr
    institution: str
    position: str
    zoom: str
    access_level: AccessLevel

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
class UserInvite(UserCreate):
    token: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


class FolderBase(BaseModel):
    name: str
    description: Optional[str] = None

class FolderCreate(FolderBase):
    parent_folder_id: Optional[int] = None

class FolderResponse(FolderBase):
    id: int
    parent_folder_id: Optional[int]
    created_at: datetime
    children: List['FolderResponse'] = []

    class Config:
        from_attributes = True


class FolderStructure(BaseModel):
    id: int
    name: str
    parent_folder_id: Optional[int]
    template_id: int

    class Config:
        orm_mode = True



class TemplateBase(BaseModel):
    name: str
    folders: List[FolderStructure]


class FolderTemplate(BaseModel):
    id: int
    name: str
    created_at: Optional[datetime]
    template_id: Optional[int]
    
    class Config:
        orm_mode = True
        
        
class TemplateCreate(TemplateBase):
    name: str
    folders: List[str]

class TemplateSchema(TemplateBase):
    id: int
    name: str
    created_at: datetime
    folders: List[FolderTemplate] = []
    
    class Config:
        orm_mode = True
        
class TemplateUpdate(BaseModel):
    originalName: str
    toBeEditedName: str
    folders: List[FolderTemplate]
    
    class Config:
        orm_mode = True 


# class TemplateResponse(BaseModel):
#     id: int
#     name: str
#     created_at: datetime
#     root_folder: FolderResponse

#     class Config:
#         from_attributes = True
class ProjectSchema(BaseModel):
    id: int
    name: str
    template_id: Optional[int]
    owner_id: int
    created_at: datetime

    class Config:
        orm_mode = True


class ProjectCreate(BaseModel):
    name: str
    template_name: Optional[str] = None
    is_shared: bool = False

class ProjectShareSchema(BaseModel):
    user_email: str
    access_level: Optional[AccessLevel] = AccessLevel.READ

class ProjectNameUpdate(BaseModel):
    new_name: str
    
class ProjectShareUpdate(BaseModel):
    shared_user_email: str
    access_level: AccessLevel
    
    

class FileBase(BaseModel): 
    name: str
    mime_type: str
    

class FileCreate(FileBase):
    folder_id: int
    
class FileUpload(BaseModel):
    pdf_url: str
    parent_folder_id: Optional[str] = None
    project_id: int
    
    
class FileSchema(FileBase):
    id: str
    class Config:
        from_attributes = True
        
        
class FileUpdate(BaseModel):
    name: Optional[str] = None
    project_id: int
    is_shared: Optional[bool] = None

class FolderBase(BaseModel):
    name: str

class FolderCreate(FolderBase):
    parent_folder_id: Optional[int] = None
    project_id: Optional[int] = None

class FolderUpdate(FolderBase):
    name: Optional[str] = None
    project_id: int
    is_shared: Optional[bool] = None

class FolderSchema(FolderBase):
    id: str

    class Config:
        from_attributes = True
        
class FolderResponse(FolderBase):
    name: str
    folder: Optional[FolderSchema] = None
    children: List[FolderSchema] = []

class ShareBase(BaseModel):
    access_level: AccessLevel

class FileShareCreate(ShareBase):
    user_id: int
    file_id: int

class FolderShareCreate(ShareBase):
    user_id: int
    folder_id: int

class ShareSchema(ShareBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class TaskSchema(BaseModel):
    id: int
    title: str
    status: str = 'pending'
    project_id: int = None
    due_date: Optional[datetime] = None

class TaskCreate(BaseModel):
    title: str
    status: str = 'pending'
    project_id: int = None
    
    
class TaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    task_status: Optional[str] = None
    project_id: int
    
class DeadlineCreate(BaseModel):
    name: str
    location: Optional[str] = None
    datetime: str
    project_id: int
    
    
class DeadlineSchema(BaseModel):
    id: int
    name: str
    location: Optional[str] = None
    datetime: str
    project_id: int
    
    
class DeadlineUpdate(BaseModel):
    id: int
    name: str
    datetime: str
    location: Optional[str] = None
    project_id: int    

class CollaboratorSchema(BaseModel):
    id: int
    name: str
    title: Optional[str] = None
    zoom_link: Optional[str] = None
    email: Optional[str] = None
    institution: Optional[str] = None
    project_id: int
    

class CollaboratorInvite(BaseModel):
    email: str
    project_id: int
    
class CollaboratorAccept(BaseModel):
    token: str
    # project_id: int

class CollaboratorCreate(CollaboratorSchema):
    project_id: int
    
    
class NoteCreate(BaseModel):
    content: str
    project_id: int
    
class NoteResponse(BaseModel):
    id: int
    content: str
    project_id: int
    
class NoteUpdate(BaseModel):
    content: str
    project_id: int
    
    
class LinkCreate(BaseModel):
    url: str
    project_id: int
    
class LinkResponse(BaseModel):
    id: int
    title: str
    url: str
    project_id: int
    
class LinkUpdate(BaseModel):
    title: str
    url: str
    project_id: int