import asyncio
from fastapi import WebSocket
from typing import List, Dict, Any

class ConnectionManager:
    def __init__(self):
        # Explicitly initialize state and async lock
        self.active_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        """Accepts and registers a new frontend WebSocket connection safely."""
        await websocket.accept()
        async with self._lock:
            if websocket not in self.active_connections:
                self.active_connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        """Removes a disconnected client from the active pool safely."""
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)

    async def broadcast_state(self, event_type: str, payload: Dict[str, Any]):
        """Pushes state updates to all connected clients and prunes dead sockets."""
        message = {"type": event_type, "data": payload}
        dead_connections = []

        async with self._lock:
            connections_snapshot = list(self.active_connections)

        for connection in connections_snapshot:
            try:
                await connection.send_json(message)
            except Exception:
                # Catch closed or broken socket connections during broadcast
                dead_connections.append(connection)

        # Cleanup dead connections if any failed during broadcast
        if dead_connections:
            async with self._lock:
                for dead in dead_connections:
                    if dead in self.active_connections:
                        self.active_connections.remove(dead)

# Instantiate the global manager singleton
manager = ConnectionManager()
