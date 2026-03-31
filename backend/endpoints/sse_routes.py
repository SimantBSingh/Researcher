import asyncio
from fastapi import APIRouter, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from jose import JWTError, jwt

from config import Config
from database import SessionLocal
from models.UserModel import User
from utils.sse_manager import sse_manager

router = APIRouter()


def _get_user_id(token: str):
    """Return user_id from a JWT token, or None if invalid."""
    try:
        payload = jwt.decode(token, Config.SESSION_SECRET_KEY, algorithms=[Config.ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            return None
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == email).first()
            return user.id if user else None
        finally:
            db.close()
    except JWTError:
        return None


@router.get("/user/events")
async def user_events(token: str = Query(...)):
    user_id = _get_user_id(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    queue = sse_manager.subscribe_user(user_id)

    async def event_stream():
        try:
            yield "data: {\"type\": \"connected\"}\n\n"
            while True:
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {data}\n\n"
                except asyncio.TimeoutError:
                    yield "data: {\"type\": \"heartbeat\"}\n\n"
        finally:
            sse_manager.unsubscribe_user(user_id, queue)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.get("/projects/{project_id}/events")
async def project_events(
    project_id: int,
    token: str = Query(...),
):
    # EventSource doesn't support custom headers, so token comes as a query param
    user_id = _get_user_id(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    queue = sse_manager.subscribe(project_id)

    async def event_stream():
        try:
            yield "data: {\"type\": \"connected\"}\n\n"
            while True:
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {data}\n\n"
                except asyncio.TimeoutError:
                    # Heartbeat to keep connection alive through proxies
                    yield "data: {\"type\": \"heartbeat\"}\n\n"
        finally:
            sse_manager.unsubscribe(project_id, queue)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
