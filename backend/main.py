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

    # Send the initial graph state upon connection
    initial_state = await digital_twin.get_topology_state()
    await manager.broadcast_state("topology_sync", initial_state)

    try:
        while True:
            # Keep connection alive and listen for frontend commands
            data = await websocket.receive_text()

            if data == "simulate_failure":
                # Simulate a structured log that matches the updated regex
                log = '[2026-09-06T19:01:13Z] CRITICAL node_id=primary_db Metrics:{"cpu_load": 99, "memory_usage": "OOM"}'

                # Process log and update the digital twin state asynchronously
                incident = await log_parser.parse_and_process(log)

                if incident:
                    # Broadcast the raw incident to the frontend immediately
                    await manager.broadcast_state("incident_alert", incident.model_dump())

                    # Trigger the AI Swarm to analyze the incident via Groq
                    ai_diagnosis = await log_agent.analyze_incident(incident)

                    # Broadcast the AI's diagnosis back to the war room dashboard
                    await manager.broadcast_state("ai_diagnosis", ai_diagnosis)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
