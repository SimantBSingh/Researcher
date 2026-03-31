from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session

from models.schema import LinkCreate, LinkResponse, LinkUpdate
from utils.helper import can_write, get_current_user
from utils.sse_manager import sse_manager
from database import get_db
from models.UserModel import User
from models.ProjectModel import Project
from models.LinkModel import Link
from bs4 import BeautifulSoup
import requests

router = APIRouter()


def get_website_name(url):
    try:
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        title = soup.find('title')
        if title:
            return title.string
        meta_tag = soup.find('meta', property='og:site_name')
        if meta_tag and 'content' in meta_tag.attrs:
            return meta_tag['content'].strip()
        return None
    except Exception:
        return None


@router.post("/")
def create_link(
    new_link: LinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not new_link.url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Link url is missing")

    if not new_link.project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required")

    db_project = db.query(Project).filter(Project.id == new_link.project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not can_write(new_link.project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    website_name = get_website_name(new_link.url)
    title = website_name if website_name else new_link.url

    link = Link(title=title, url=new_link.url, project_id=new_link.project_id)
    db.add(link)
    db.commit()
    db.refresh(link)
    sse_manager.emit(new_link.project_id, "links_changed")
    return {"message": "Operation Successful", "last_inserted_id": link.id}


@router.get("/{project_id}/")
def get_links(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required")

    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    links = db.query(Link).filter(Link.project_id == project_id).all()
    return [LinkResponse(id=l.id, title=l.title or l.url, url=l.url, project_id=l.project_id) for l in links]


@router.put("/{link_id}/{project_id}")
def update_link(
    link_id: int,
    project_id: int,
    updated_link: LinkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not link_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Link ID is required")

    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not can_write(updated_link.project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    link = db.query(Link).filter(Link.id == link_id).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")

    link.title = updated_link.title
    link.url = updated_link.url
    db.commit()
    sse_manager.emit(project_id, "links_changed")
    return {"message": "Operation Successful"}


@router.delete("/{link_id}/{project_id}")
def delete_link(
    link_id: int,
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not link_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Link ID is required")

    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not can_write(project_id, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have write access to this project")

    link = db.query(Link).filter(Link.id == link_id).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")

    db.delete(link)
    db.commit()
    sse_manager.emit(project_id, "links_changed")
    return {"message": "Operation Successful"}
