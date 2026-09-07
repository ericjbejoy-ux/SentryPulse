"""FR-7: Autonomous Self-Healing webhook (unified backend).

Promoted from app/routers/webhook.py + app/services/*, rewired so the
twin reset actually clears the unified DigitalTwinState instead of
checking for a state file on disk.

Flow: try n8n forward (2s timeout) -> restart the real victim process
via the demo-site supervisor when DEMO_SITE_URL is set -> on failure use
demo fallback -> always reset the live twin (FR-7.3).
"""
import logging
import time
import uuid
from typing import Any, Dict, Optional

import httpx
from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.core.config import settings
from backend.telemetry.state import twin_state

logger = logging.getLogger("uvicorn.error")
router = APIRouter(prefix="/api/v1/n8n", tags=["n8n-webhook"])

# node id OR canvas label -> demo-site supervisor service name.
# upi-settlement-cache has no victim process: restart is skipped for it.
NODE_TO_SUPERVISOR_SVC = {
    "idfc-api-gateway": "gateway",
    "kong-api-gateway": "gateway",
    "core-banking-switch": "api",
    "cbs-db-primary": "dbsim",
    "postgres-cbs-primary": "dbsim",
}


def supervisor_service_for(node_id: str) -> Optional[str]:
    return NODE_TO_SUPERVISOR_SVC.get((node_id or "").strip().lower())


class AnomalyTriggerPayload(BaseModel):
    node_id: str = Field(default="cbs-db-primary")
    anomaly_type: str = Field(default="THREADPOOL_LOCK")
    strategy: Optional[str] = None
    severity: str = "high"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class HealingResponse(BaseModel):
    status: str
    execution_id: str
    node_id: str
    action_taken: str
    fallback_engaged: bool
    twin_state_updated: bool
    mttr_seconds: float
    details: Dict[str, Any] = Field(default_factory=dict)


def _fallback_heal(node_id: str, anomaly_type: str) -> HealingResponse:
    return HealingResponse(
        status="SUCCESS",
        execution_id=f"n8n-exec-{uuid.uuid4().hex[:6]}",
        node_id=node_id,
        action_taken=(
            f"Isolated {node_id}, rerouted traffic via edge mesh, "
            f"auto-heal for {anomaly_type}."
        ),
        fallback_engaged=True,
        twin_state_updated=True,
        mttr_seconds=1.2,
        details={"simulated": True, "reason": "n8n unreachable; local fallback"},
    )


@router.post("/trigger", response_model=HealingResponse)
async def trigger_healing(payload: AnomalyTriggerPayload) -> HealingResponse:
    strategy = payload.strategy or payload.anomaly_type
    # 1. Best-effort forward to the external orchestrator (n8n / K8s hook).
    n8n_ok = False
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(
                settings.n8n_webhook_url,
                json={
                    "strategy": strategy,
                    "target": payload.node_id,
                    "timestamp": int(time.time()),
                    **payload.model_dump(),
                },
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            n8n_ok = True
    except Exception as exc:
        logger.warning("n8n forward failed (%s); engaging demo fallback.", exc)

    # 1b. Best-effort restart of the REAL victim process (demo-site mode).
    restarted: Optional[Dict[str, Any]] = None
    svc = supervisor_service_for(payload.node_id)
    if svc and settings.demo_site_url:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    f"{settings.demo_site_url.rstrip('/')}/restart/{svc}"
                )
                resp.raise_for_status()
                restarted = {"service": svc, **resp.json()}
                logger.info("demo-site restarted %s: %s", svc, restarted)
        except Exception as exc:
            logger.warning("demo-site restart of %s failed (%s)", svc, exc)
            restarted = {"service": svc, "error": str(exc)}

    # 2. Always reset the live twin so the canvas recovers (FR-7.3, NFR-1.3).
    try:
        twin_state.clear_chaos()
        twin_ok = True
    except Exception as exc:
        logger.error("Twin reset failed: %s", exc)
        twin_ok = False

    if not n8n_ok and settings.demo_fallback_mode:
        fb = _fallback_heal(payload.node_id, strategy)
        fb.twin_state_updated = twin_ok
        if restarted:
            fb.details["victim_restart"] = restarted
        return fb

    details: Dict[str, Any] = {"severity": payload.severity, "n8n_confirmed": n8n_ok}
    if restarted:
        details["victim_restart"] = restarted
    return HealingResponse(
        status="SUCCESS",
        execution_id=f"n8n-exec-{uuid.uuid4().hex[:6]}",
        node_id=payload.node_id,
        action_taken=f"Processed anomaly '{strategy}' successfully. Twin re-balanced.",
        fallback_engaged=False,
        twin_state_updated=twin_ok,
        mttr_seconds=1.2,
        details=details,
    )
