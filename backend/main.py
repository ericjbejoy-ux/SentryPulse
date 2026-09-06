from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from backend.core.config import settings
from backend.core.websocket import manager
from backend.telemetry.twin import digital_twin
from backend.telemetry.log_parser import LogParser
from backend.ai.agents.log_agent import log_agent

app = FastAPI(title=settings.app_name)
log_parser = LogParser()

@app.get("/api/health")
async def health_check():
    """REST endpoint to verify server and graph state."""
    return {
        "status": "online",
        "topology": await digital_twin.get_topology_state()
    }

@app.websocket("/ws/telemetry")
async def telemetry_stream(websocket: WebSocket):
    """WebSocket endpoint for the React Flow spatial canvas."""
    await manager.connect(websocket)
    print("[WS] Client connected successfully!")

    # Send the initial graph state upon connection
    initial_state = await digital_twin.get_topology_state()
    await manager.broadcast_state("topology_sync", initial_state)

    try:
        while True:
            # Wait for text from the frontend/wscat
            data = await websocket.receive_text()
            print(f"[WS] Received text from client: '{data}'")

            if data.strip() == "simulate_failure":
                print("[WS] Triggering failure simulation...")
                log = '[2026-09-06T19:01:13Z] CRITICAL node_id=primary_db Metrics:{"cpu_load": 99, "memory_usage": "OOM"}'

                incident = await log_parser.parse_and_process(log)

                if incident:
                    print("[WS] Broadcasting incident alert...")
                    await manager.broadcast_state("incident_alert", incident.model_dump(mode='json'))

                    print("[WS] Querying Groq AI agent...")
                    ai_diagnosis = await log_agent.analyze_incident(incident)

                    print(f"[WS] Broadcasting AI diagnosis: {ai_diagnosis}")
                    await manager.broadcast_state("ai_diagnosis", ai_diagnosis)
                else:
                    print("[WS] Error: Log parser did not return an incident!")
            else:
                print(f"[WS] Unrecognized command received: '{data}'")

    except WebSocketDisconnect:
        print("[WS] Client disconnected.")
        await manager.disconnect(websocket)
