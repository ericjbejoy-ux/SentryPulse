from fastapi import WebSocket
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_state(self, event_type: str, payload: dict):
        """Pushes state updates (telemetry, incidents) to all connected frontends."""
        message = {"type": event_type, "data": payload}
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()
