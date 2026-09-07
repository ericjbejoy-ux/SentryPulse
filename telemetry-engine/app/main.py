"""
Person 1 deliverable — feature/telemetry-engine

Exposes exactly the three endpoints assigned to this branch in SRS.md
section "4-Member Work Distribution Plan":
  GET  /api/v1/telemetry/live
  POST /api/v1/simulation/start
  SSE  /api/v1/telemetry/stream

Run with:  uvicorn app.main:app --reload --port 8000
"""
import asyncio
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from .anomaly import anomaly_scorer
from .schemas import SimulationRequest, SimulationResult, TelemetrySnapshot
from .simulation import run_simulation
from .telemetry import twin_state

POLL_INTERVAL_SECONDS = 1.0  # NFR-1.1 allows up to 1.5s; 1.0s leaves headroom

app = FastAPI(
    title="SentryPulse — Telemetry Engine",
    description="FR-1, FR-3, FR-4: digital twin state, Monte Carlo simulation, anomaly scoring.",
    version="1.0.0",
)

# Wide open for the hackathon build so Person 3's frontend (any dev port)
# can hit this without CORS friction; tighten before anything resembling
# a real deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def start_polling_loop() -> None:
    """FR-1.1: continuously advance the digital twin state in the background
    so /telemetry/live and /telemetry/stream always read fresh data,
    regardless of whether anyone is actively polling."""
    asyncio.create_task(_poll_loop())


async def _poll_loop() -> None:
    while True:
        twin_state.tick(anomaly_scorer)
        await asyncio.sleep(POLL_INTERVAL_SECONDS)


@app.get("/api/v1/telemetry/live", response_model=TelemetrySnapshot)
async def get_live_telemetry() -> TelemetrySnapshot:
    """SRS 5.1 — single-shot poll of the current metric vector."""
    return twin_state.as_flat_snapshot()


@app.get("/api/v1/telemetry/stream")
async def stream_telemetry() -> EventSourceResponse:
    """FR-8.1 — SSE stream so the frontend terminal drawer and topology
    canvas update live without client-side polling."""

    async def event_generator():
        while True:
            snapshot = twin_state.as_flat_snapshot()
            yield {
                "event": "telemetry",
                "data": json.dumps(snapshot.model_dump()),
            }
            await asyncio.sleep(POLL_INTERVAL_SECONDS)

    return EventSourceResponse(event_generator())


@app.post("/api/v1/simulation/start", response_model=SimulationResult)
async def start_simulation(req: SimulationRequest) -> SimulationResult:
    """SRS 5.2 / FR-3 — runs the vectorized Monte Carlo engine and, if the
    outcome is bad enough, injects chaos into the live twin so the rest of
    the demo (swarm triage, Pareto engine, self-healing) has something
    real to react to."""
    result = run_simulation(req)
    if result.vector_drift != "NOMINAL":
        # SRS section 2: cbs-db-primary is the node this chaos profile
        # models (transactional write-lock contention).
        from .schemas import TopologyNodeId
        twin_state.inject_chaos(TopologyNodeId.CBS_DB_PRIMARY)
    return result


@app.post("/api/v1/telemetry/reset")
async def reset_telemetry() -> dict:
    """FR-7.3 support hook — called after a webhook returns 200 OK so this
    service's state matches the "all nodes NOMINAL" outcome n8n reports."""
    twin_state.clear_chaos()
    return {"status": "RESET"}


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
