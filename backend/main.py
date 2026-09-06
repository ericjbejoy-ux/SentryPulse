from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from backend.core.config import settings
from backend.core.websocket import manager
from backend.telemetry.twin import DigitalTwinEngine
from backend.telemetry.log_parser import LogParser

app = FastAPI(title=settings.app_name)

# Initialize Jr. Backend Modules
twin_engine = DigitalTwinEngine()
log_parser = LogParser()

@app.get("/api/health")
async def health_check():
    """REST endpoint to verify server and graph state."""
    return {
        "status": "online",
        "topology": twin_engine.get_topology_state()
    }

@app.websocket("/ws/telemetry")
async def telemetry_stream(websocket: WebSocket):
    """WebSocket endpoint for the React Flow spatial canvas."""
    await manager.connect(websocket)

    # Send initial graph state upon connection
    initial_state = twin_engine.get_topology_state()
    await manager.broadcast_state("topology_sync", initial_state)

    try:
        while True:
            # Keep connection alive and listen for frontend commands
            data = await websocket.receive_text()

            # Example: Frontend triggering a manual failure simulation
            if data == "simulate_failure":
                log = "[CRITICAL] node_id=primary_db connection dropped"
                incident = log_parser.parse_log(log)
                if incident:
                    await manager.broadcast_state("incident_alert", incident.model_dump())

    except WebSocketDisconnect:
        manager.disconnect(websocket)
