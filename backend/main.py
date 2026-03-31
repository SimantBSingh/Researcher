import asyncio
import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware

from endpoints.project_routes import router as project_router
from endpoints.template_routes import router as template_router
from endpoints.auth import router as auth_router
from endpoints.folder_file_routes import router as folder_file_router
from endpoints.task_routes import router as task_router
from endpoints.deadline_routes import router as deadline_router
from endpoints.collaborator_routes import router as collaborator_router
from endpoints.note_routes import router as note_router
from endpoints.link_routes import router as link_router
from endpoints.health_test import router as health_test_router
from endpoints.sse_routes import router as sse_router

from database import init_db
from config import Config
from utils.sse_manager import sse_manager

app = FastAPI()


@app.on_event("startup")
async def startup():
    sse_manager.set_loop(asyncio.get_event_loop())

origins = [o.strip() for o in Config.FRONTEND_URL.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=Config.SESSION_SECRET_KEY, max_age=3600)

if os.path.exists("../dist"):
    app.mount("/", StaticFiles(directory="../dist", html=True), name="static")

init_db()

app.include_router(auth_router, prefix="/auth")
app.include_router(project_router, prefix="/api/projects")
app.include_router(template_router, prefix="/api/templates")
app.include_router(folder_file_router, prefix="/api/folder_file")
app.include_router(task_router, prefix="/api/tasks")
app.include_router(deadline_router, prefix="/api/deadlines")
app.include_router(collaborator_router, prefix="/api/collaborators")
app.include_router(note_router, prefix="/api/notes")
app.include_router(link_router, prefix="/api/links")
app.include_router(health_test_router, prefix="/api")
app.include_router(sse_router, prefix="/api/sse")
