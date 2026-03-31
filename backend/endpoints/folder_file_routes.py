from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status, File as fastapiFile, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional

from models.schema import FileSchema, FileUpdate, FolderUpdate, FileUpload, FolderSchema
from models.UserModel import User
from models.FolderModel import Folder, File
from utils.helper import can_write, get_current_user, fetch_arxiv_title, extract_arxiv_id
from utils.sse_manager import sse_manager
from database import get_db

import requests
import urllib.parse

router = APIRouter()


# ============== Folder Operations ==============

@router.post("/folders/{project_id}", response_model=FolderSchema)
def create_folder(
    project_id: int,
    folder_id: str = Query(...),
    new_folder_name: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_write(project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    parent_db_id = int(folder_id) if folder_id.isdigit() else None

    if parent_db_id:
        parent = db.query(Folder).filter(Folder.id == parent_db_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail=f"Parent folder with id {folder_id} not found")

    new_folder = Folder(name=new_folder_name, parent_id=parent_db_id, project_id=project_id)
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)
    sse_manager.emit(project_id, "files_changed")
    return FolderSchema(id=str(new_folder.id), name=new_folder.name)


# @router.get("/folders/", response_model=List[FolderSchema])
# def get_folders(
#     parent_folder_id: Optional[str] = None,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     print(f"Received request for folders with parent_folder_id: {parent_folder_id}")
#     parent_db_id = int(parent_folder_id) if parent_folder_id and parent_folder_id.isdigit() else None

#     if parent_db_id:
#         parent = db.query(Folder).filter(Folder.id == parent_db_id).first()
#         if not parent:
#             raise HTTPException(status_code=404, detail=f"Parent folder with id {parent_folder_id} not found")

#     folders = db.query(Folder).filter(Folder.parent_id == parent_db_id).all()
#     return [FolderSchema(id=str(f.id), name=f.name) for f in folders]


@router.get("/project_root_contents/{project_id}")
def get_project_root_contents(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    child_folders = db.query(Folder).filter(
        Folder.project_id == project_id,
        Folder.parent_id == None,
    ).all()
    child_files = db.query(File).filter(
        File.project_id == project_id,
        File.folder_id == None,
    ).all()
    return {
        "folders": [FolderSchema(id=str(f.id), name=f.name) for f in child_folders],
        "files": [FileSchema(id=str(f.id), name=f.name, mime_type=f.mime_type or "") for f in child_files],
    }


@router.get("/folder_contents/{parent_folder_id}")
def get_folder_contents(
    parent_folder_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    print(f"Received request for folder contents with parent_folder_id: {parent_folder_id}")
    parent_db_id = int(parent_folder_id) if parent_folder_id.isdigit() else None
    print(f"Fetching contents for parent_folder_id: {parent_folder_id} (db id: {parent_db_id})")

    if parent_db_id:
        parent = db.query(Folder).filter(Folder.id == parent_db_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail=f"Parent folder with id {parent_folder_id} not found")

    child_folders = db.query(Folder).filter(Folder.parent_id == parent_db_id).all()
    child_files = db.query(File).filter(File.folder_id == parent_db_id).all()

    return {
        "folders": [FolderSchema(id=str(f.id), name=f.name) for f in child_folders],
        "files": [FileSchema(id=str(f.id), name=f.name, mime_type=f.mime_type or "") for f in child_files],
    }


@router.get("/folders/{folder_id}", response_model=FolderSchema)
def get_folder(
    folder_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    print(f"Received request for folder with folder_id: {folder_id}")
    folder_db_id = int(folder_id) if folder_id.isdigit() else None
    folder = db.query(Folder).filter(Folder.id == folder_db_id).first() if folder_db_id else None
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return FolderSchema(id=str(folder.id), name=folder.name)


@router.delete("/folders/{project_id}/{folder_id}")
def delete_folder(
    project_id: int,
    folder_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_write(project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    if not folder_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Folder ID is required")

    folder_db_id = int(folder_id) if folder_id.isdigit() else None
    folder = db.query(Folder).filter(Folder.id == folder_db_id).first() if folder_db_id else None
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    db.delete(folder)
    db.commit()
    sse_manager.emit(project_id, "files_changed")
    return {"message": "Folder deleted successfully"}


@router.put("/folders/{folder_id}")
def edit_folder(
    folder_id: str,
    folderUpdate: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_write(folderUpdate.project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    if not folder_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Folder ID is required")

    if not folderUpdate.name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Folder name is required")

    folder_db_id = int(folder_id) if folder_id.isdigit() else None
    folder = db.query(Folder).filter(Folder.id == folder_db_id).first() if folder_db_id else None
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    folder.name = folderUpdate.name
    db.commit()
    sse_manager.emit(folderUpdate.project_id, "files_changed")
    return {"message": "Folder renamed successfully"}


# ============== File Operations ==============

@router.post("/files")
async def create_file(
    file: UploadFile = fastapiFile(...),
    parent_folder_id: str = Form(...),
    project_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_write(project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    folder_db_id = int(parent_folder_id) if parent_folder_id.isdigit() else None
    if folder_db_id:
        folder = db.query(Folder).filter(Folder.id == folder_db_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Parent folder not found")

    file_content = await file.read()
    new_file = File(
        name=file.filename,
        mime_type=file.content_type,
        content=file_content,
        folder_id=folder_db_id,
        project_id=project_id,
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    sse_manager.emit(project_id, "files_changed")
    return {"message": "File uploaded successfully", "file_id": str(new_file.id), "view_link": f"/api/folder_file/files/view/{new_file.id}"}


@router.post("/files/upload_file_via_url")
async def upload_file_via_url(
    data: FileUpload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pdf_url = data.pdf_url
    parent_folder_id = data.parent_folder_id
    project_id = data.project_id

    if not can_write(project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    if not pdf_url:
        raise HTTPException(status_code=400, detail="PDF URL is required")

    try:
        pdf_response = requests.get(pdf_url, timeout=30)
        if pdf_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to download PDF. Check the URL.")

        pdf_content = pdf_response.content
        file_name = "Untitled.pdf"
        arxiv_id = extract_arxiv_id(pdf_url)
        if arxiv_id:
            file_title = fetch_arxiv_title(arxiv_id)
            if file_title:
                file_name = f"{file_title}.pdf"

        folder_db_id = int(parent_folder_id) if parent_folder_id and parent_folder_id.isdigit() else None
        new_file = File(
            name=file_name,
            mime_type='application/pdf',
            content=pdf_content,
            folder_id=folder_db_id,
            project_id=project_id,
        )
        db.add(new_file)
        db.commit()
        db.refresh(new_file)
        sse_manager.emit(project_id, "files_changed")
        return {"message": "PDF uploaded and saved!", "pdf_id": str(new_file.id)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not download from the link: " + str(e))


@router.get("/files/{folder_id}", response_model=List[FileSchema])
def get_files(
    folder_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder_db_id = int(folder_id) if folder_id.isdigit() else None
    if folder_db_id:
        folder = db.query(Folder).filter(Folder.id == folder_db_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail=f"Parent folder with id {folder_id} not found")

    files = db.query(File).filter(File.folder_id == folder_db_id).all()
    return [FileSchema(id=str(f.id), name=f.name, mime_type=f.mime_type or "") for f in files]


@router.get("/files/view/{file_id}")
def request_file(
    file_id: str,
    db: Session = Depends(get_db),
):
    if not file_id:
        raise HTTPException(status_code=400, detail="File ID is required")

    file_db_id = int(file_id) if file_id.isdigit() else None
    file = db.query(File).filter(File.id == file_db_id).first() if file_db_id else None
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    return Response(
        content=file.content,
        media_type=file.mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": f"inline; filename=\"{urllib.parse.quote(file.name)}\"",
            "Content-Length": str(len(file.content) if file.content else 0),
            "Access-Control-Expose-Headers": "Content-Disposition",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.put("/files/{file_id}")
def edit_file(
    file_id: str,
    fileUpdate: FileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_write(fileUpdate.project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    if not file_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File ID is required")

    if not fileUpdate.name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File name is required")

    file_db_id = int(file_id) if file_id.isdigit() else None
    file = db.query(File).filter(File.id == file_db_id).first() if file_db_id else None
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    file.name = fileUpdate.name
    db.commit()
    sse_manager.emit(fileUpdate.project_id, "files_changed")
    return {"message": "File updated successfully"}


@router.delete("/files/{project_id}/{file_id}")
def delete_file(
    file_id: str,
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_write(project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    if not file_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File ID is required")

    file_db_id = int(file_id) if file_id.isdigit() else None
    file = db.query(File).filter(File.id == file_db_id).first() if file_db_id else None
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    db.delete(file)
    db.commit()
    sse_manager.emit(project_id, "files_changed")
    return {"message": "File deleted successfully"}
