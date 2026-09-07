"""Demo-site proxy: live topology + in-UI fault injection (FR-2 / FR-7 demo).

The browser only ever talks to :8000 (victims have no CORS). Every route
here requires DEMO_SITE_URL; otherwise it answers 503 with a hint, and
the frontend hides the live controls.

Routes:
  GET  /api/v1/demo/topology   4 live nodes + PIDs + edges for the canvas
  POST /api/v1/demo/fault      {target, type, latency_ms?, duration_s?}
  POST /api/v1/demo/kill/{svc}
  POST /api/v1/demo/restart/{svc}
  POST /api/v1/demo/clear      clear faults on all victims
"""
import logging
from typing import Any, Dict, List

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.core.config import settings
from backend.routers.healing import supervisor_service_for
from backend.telemetry.state import twin_state

logger = logging.getLogger("uvicorn.error")
router = APIRouter(prefix="/api/v1/demo", tags=["demo-site"])

SVC_PORTS = {"gateway": 8001, "api": 8002, "dbsim": 8003}

# Twin node -> canvas display slot (same coordinates as the static canvas
# uses for these services, so the layout doesn't jump on switch).
# 3 victims only: the cache node has no victim and stays out of the graph.
LIVE_DISPLAY = {
    "idfc-api-gateway": {
        "label": "kong-api-gateway", "tier": "Gateway",
        "ip": "10.240.0.12", "x": 360, "y": 120,
    },
    "core-banking-switch": {
        "label": "core-banking-switch", "tier": "Routing",
        "ip": "10.240.0.15", "x": 660, "y": 100,
    },
    "cbs-db-primary": {
        "label": "postgres-cbs-primary", "tier": "Storage",
        "ip": "10.240.1.20", "x": 940, "y": 210,
    },
}

LIVE_EDGES = [
    ("idfc-api-gateway", "core-banking-switch"),
    ("core-banking-switch", "cbs-db-primary"),
]

FAULT_TYPES = {"latency", "deadlock", "clear"}


class FaultRequest(BaseModel):
    target: str = Field(description="svc name, node id, or canvas label")
    type: str = Field(description="latency | deadlock | clear")
    latency_ms: float = 2000.0
    duration_s: float = 60.0


def _require_live() -> str:
    if not settings.demo_site_url:
        raise HTTPException(
            status_code=503,
            detail="demo-site not active: restart the backend with DEMO_SITE_URL set",
        )
    return settings.demo_site_url.rstrip("/")


def _supervisor_svc(target: str) -> str:
    svc = (target or "").strip().lower()
    if svc in SVC_PORTS:
        return svc
    if svc == "db":
        return "dbsim"
    mapped = supervisor_service_for(target)
    if mapped:
        return mapped
    raise HTTPException(status_code=404, detail=f"unknown demo target {target!r}")


@router.get("/topology")
async def demo_topology() -> Dict[str, Any]:
    base = _require_live()
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            status = (await client.get(f"{base}/status")).json()
    except Exception as exc:
        logger.warning("supervisor status failed (%s)", exc)
        status = {}
    nodes: List[Dict[str, Any]] = []
    for n in twin_state.as_node_list():
        if n.node_id.value not in LIVE_DISPLAY:
            continue  # no victim: hidden from the live graph
        disp = LIVE_DISPLAY[n.node_id.value]
        svc = supervisor_service_for(n.node_id.value)
        nodes.append(
            {
                **n.model_dump(),
                **disp,
                "supervisor_svc": svc,
                "pid": (status.get(svc, {}) or {}).get("pid") if svc else None,
            }
        )
    return {
        "source": twin_state.source,
        "nodes": nodes,
        "edges": [list(e) for e in LIVE_EDGES],
    }


@router.post("/fault")
async def demo_fault(req: FaultRequest) -> Dict[str, Any]:
    _require_live()
    if req.type not in FAULT_TYPES:
        raise HTTPException(status_code=422, detail=f"type must be one of {sorted(FAULT_TYPES)}")
    svc = _supervisor_svc(req.target)
    host = _victim_host()
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.post(
            f"http://{host}:{SVC_PORTS[svc]}/fault",
            json={"type": req.type, "latency_ms": req.latency_ms, "duration_s": req.duration_s},
        )
        resp.raise_for_status()
        return {"service": svc, "fault": resp.json().get("fault")}


@router.post("/kill/{svc}")
async def demo_kill(svc: str) -> Dict[str, Any]:
    base = _require_live()
    svc = _supervisor_svc(svc)
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.post(f"{base}/kill/{svc}")
        resp.raise_for_status()
        return resp.json()


@router.post("/restart/{svc}")
async def demo_restart(svc: str) -> Dict[str, Any]:
    base = _require_live()
    svc = _supervisor_svc(svc)
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(f"{base}/restart/{svc}")
        resp.raise_for_status()
        return resp.json()


@router.post("/clear")
async def demo_clear() -> Dict[str, Any]:
    _require_live()
    host = _victim_host()
    out: Dict[str, Any] = {}
    async with httpx.AsyncClient(timeout=5.0) as client:
        for svc, port in SVC_PORTS.items():
            try:
                resp = await client.post(
                    f"http://{host}:{port}/fault", json={"type": "clear"}
                )
                resp.raise_for_status()
                out[svc] = "cleared"
            except Exception as exc:
                out[svc] = f"unreachable ({exc})"
    return out


def _victim_host() -> str:
    from urllib.parse import urlparse

    return urlparse(settings.demo_site_url).hostname or "127.0.0.1"
