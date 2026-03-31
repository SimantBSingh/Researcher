import asyncio
import json
from typing import Dict, List, Optional


class SSEManager:
    def __init__(self):
        self._subscribers: Dict[int, List[asyncio.Queue]] = {}
        self._user_subscribers: Dict[int, List[asyncio.Queue]] = {}
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop

    def subscribe(self, project_id: int) -> asyncio.Queue:
        queue = asyncio.Queue(maxsize=50)
        if project_id not in self._subscribers:
            self._subscribers[project_id] = []
        self._subscribers[project_id].append(queue)
        return queue

    def unsubscribe(self, project_id: int, queue: asyncio.Queue):
        if project_id in self._subscribers:
            try:
                self._subscribers[project_id].remove(queue)
            except ValueError:
                pass

    def subscribe_user(self, user_id: int) -> asyncio.Queue:
        queue = asyncio.Queue(maxsize=50)
        if user_id not in self._user_subscribers:
            self._user_subscribers[user_id] = []
        self._user_subscribers[user_id].append(queue)
        return queue

    def unsubscribe_user(self, user_id: int, queue: asyncio.Queue):
        if user_id in self._user_subscribers:
            try:
                self._user_subscribers[user_id].remove(queue)
            except ValueError:
                pass

    def emit_to_user(self, user_id: int, event_type: str, project_id: int = None):
        """Thread-safe emit to a specific user's SSE channel."""
        if not self._loop or not self._user_subscribers.get(user_id):
            return
        data = {"type": event_type}
        if project_id is not None:
            data["project_id"] = project_id
        payload = json.dumps(data)
        for queue in list(self._user_subscribers.get(user_id, [])):
            try:
                self._loop.call_soon_threadsafe(queue.put_nowait, payload)
            except Exception:
                pass

    def emit(self, project_id: int, event_type: str):
        """Thread-safe emit — safe to call from sync FastAPI routes."""
        if not self._loop or not self._subscribers.get(project_id):
            return
        payload = json.dumps({"type": event_type})
        for queue in list(self._subscribers.get(project_id, [])):
            try:
                self._loop.call_soon_threadsafe(queue.put_nowait, payload)
            except Exception:
                pass


sse_manager = SSEManager()
