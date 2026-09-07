"""SentryPulse — unified single-backend MVP (port :8000).

Merges the three previously separate FastAPI services into one app so a
fresh clone only needs: pip install + uvicorn backend.main:app.

  Person 1 (backend/telemetry + backend/ml) -> live tick loop, SSE stream,
                                  Monte Carlo, Isolation Forest anomaly scorer
  Person 2 (backend/ai) -> Groq-live swarm triage + Pareto options
  Person 4 (backend/routers/healing) -> n8n self-healing webhook w/ fallback
  Legacy WS path -> kept for chaos/host_agent.py compat

Run:  uvicorn backend.main:app --host 0.0.0.0 --port 8000
Docs: http://localhost:8000/docs
"""
import asyncio
import json
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from backend.ai.swarm import swarm_engine
from backend.core.config import groq_client, settings
from backend.core.websocket import manager
from backend.ml.anomaly import anomaly_scorer
from backend.models.twin_schemas import (
    SimulationRequest,
    SimulationResult,
    TelemetrySnapshot,
    TopologyNodeId,
)
from backend.routers import healing
from backend.telemetry import twin as legacy_twin_mod
from backend.telemetry.log_parser import LogParser
from backend.telemetry.state import twin_state

try:
    from backend.ai.agents.log_agent import log_agent
except Exception:  # Groq optional at import time
    log_agent = None

POLL_INTERVAL_SECONDS = 1.0  # NFR-1.1 budget is 1.5s; 1.0s leaves headroom


async def _poll_loop() -> None:
    while True:
        try:
            twin_state.tick(anomaly_scorer)
        except Exception:
            pass
        await asyncio.sleep(POLL_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_poll_loop())
    yield
    task.cancel()


app = FastAPI(
    title="SentryPulse — Unified MVP API",
    description=(
        "Single-backend MVP: digital twin + anomaly detection + Monte Carlo "
        "simulation + Groq-live AI swarm + Pareto options + n8n self-healing."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(healing.router)

log_parser = LogParser()


# ---------------------------------------------------------------- health
@app.get("/")
async def root() -> Dict[str, Any]:
    return {
        "status": "online",
        "service": "SentryPulse Unified MVP",
        "docs": "/docs",
        "groq_live": groq_client is not None,
    }


@app.get("/health")
async def health() -> Dict[str, Any]:
    return {"status": "ok"}


@app.get("/api/health")
async def api_health() -> Dict[str, Any]:
    topo = await legacy_twin_mod.digital_twin.get_topology_state()
    return {
        "status": "online",
        "groq_live": groq_client is not None,
        "topology_nodes": len(topo.get("nodes", [])),
    }


# ------------------------------------------------------------- telemetry
@app.get("/api/v1/telemetry/live", response_model=TelemetrySnapshot)
async def get_live_telemetry() -> TelemetrySnapshot:
    """SRS 5.1 — single-shot poll of the current metric vector."""
    return twin_state.as_flat_snapshot()


@app.get("/api/v1/telemetry/nodes")
async def get_telemetry_nodes() -> Dict[str, Any]:
    """Full per-node twin state for the canvas + inspection drawer."""
    return {
        "nodes": [n.model_dump() for n in twin_state.as_node_list()],
        "snapshot": twin_state.as_flat_snapshot().model_dump(),
    }


@app.get("/api/v1/telemetry/stream")
async def stream_telemetry() -> EventSourceResponse:
    """FR-8.1 — SSE stream for the canvas + terminal drawer."""

    async def event_generator():
        while True:
            snapshot = twin_state.as_flat_snapshot()
            yield {
                "event": "telemetry",
                "data": json.dumps(snapshot.model_dump()),
            }
            await asyncio.sleep(POLL_INTERVAL_SECONDS)

    return EventSourceResponse(event_generator())


@app.post("/api/v1/telemetry/reset")
async def reset_telemetry() -> Dict[str, str]:
    """FR-7.3 support hook — reset twin to all-NOMINAL."""
    twin_state.clear_chaos()
    return {"status": "RESET"}


@app.post("/api/v1/reset")
async def reset_alias() -> Dict[str, str]:
    twin_state.clear_chaos()
    return {"status": "RESET"}


# ------------------------------------------------------------ simulation
@app.post("/api/v1/simulation/start", response_model=SimulationResult)
async def start_simulation(req: SimulationRequest) -> SimulationResult:
    """SRS 5.2 / FR-3 — vectorized Monte Carlo; bad outcomes inject live chaos."""
    from backend.telemetry.simulation import run_simulation

    result = run_simulation(req)
    if result.vector_drift != "NOMINAL":
        twin_state.inject_chaos(TopologyNodeId.CBS_DB_PRIMARY)
    return result


# ----------------------------------------------------------- swarm + pareto
class TriageResponse(BaseModel):
    status: str
    log_agent: str
    predictor_agent: str
    patch_agent: str
    pareto_options: List[Dict[str, Any]]
    groq_live: bool = False
    groq_diagnosis: Optional[Dict[str, Any]] = None
    failing_node: str


@app.post("/api/v1/triage", response_model=TriageResponse)
async def trigger_triage(
    telemetry_data: Optional[Dict[str, Any]] = None,
    use_groq: bool = Query(default=True, description="Set false to force rules-only"),
) -> TriageResponse:
    """FR-5 — multi-agent triage. Empty body triages the live snapshot."""
    if not telemetry_data:
        telemetry_data = twin_state.as_flat_snapshot().model_dump()
    analysis = await swarm_engine.process_triage_async(
        telemetry_data, use_groq=use_groq
    )
    return TriageResponse(
        status="SUCCESS",
        log_agent=analysis.log_agent_output,
        predictor_agent=analysis.predictor_agent_output,
        patch_agent=analysis.patch_agent_output,
        pareto_options=analysis.pareto_options,
        groq_live=analysis.groq_live,
        groq_diagnosis=analysis.groq_diagnosis,
        failing_node=str(telemetry_data.get("failing_node") or "cbs-db-primary"),
    )


@app.get("/api/v1/pareto/options")
async def pareto_options(
    failing_node: str = Query(default="cbs-db-primary"),
) -> Dict[str, Any]:
    """FR-6 — Pareto trade-off matrix (MTTR vs cost vs SLA risk)."""
    return {
        "status": "SUCCESS",
        "failing_node": failing_node,
        "options": swarm_engine.generate_pareto_frontier(failing_node),
    }


# ------------------------------------------------- legacy WS (compat path)
@app.websocket("/ws/telemetry")
async def telemetry_stream(websocket: WebSocket):
    """Legacy WebSocket kept for chaos/host_agent.py + early frontend builds."""
    await manager.connect(websocket)
    try:
        initial_state = await legacy_twin_mod.digital_twin.get_topology_state()
        await manager.broadcast_state("topology_sync", initial_state)
        while True:
            data = await websocket.receive_text()
            if data.strip() == "simulate_failure":
                log = (
                    "[2026-09-06T19:01:13Z] CRITICAL node_id=cbs-db-primary "
                    'Metrics:{"cpu_load": 99, "memory_usage": "OOM"}'
                )
                incident = await log_parser.parse_and_process(log)
                if incident:
                    await manager.broadcast_state(
                        "incident_alert", incident.model_dump(mode="json")
                    )
                    if log_agent is not None:
                        ai_diagnosis = await log_agent.analyze_incident(incident)
                        await manager.broadcast_state("ai_diagnosis", ai_diagnosis)
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
