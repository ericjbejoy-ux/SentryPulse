from fastapi import APIRouter, HTTPException, status
from app.models.schemas import AnomalyTriggerPayload, HealingResponseSchema
from app.services.twin_sync import TwinSyncService
from app.services.fallback import DemoFallbackService
from app.config import settings
import httpx
import logging

router = APIRouter(prefix="/api/v1/n8n", tags=["n8n-webhook"])
logger = logging.getLogger("uvicorn.error")

@router.post("/trigger", response_model=HealingResponseSchema, status_code=status.HTTP_200_OK)
async def trigger_n8n_healing(payload: AnomalyTriggerPayload):
    """
    FastAPI self-healing webhook endpoint triggered by n8n or frontend UI (Person 3).
    Executes digital twin state sync with fallback resilience for the live demo.
    """
    try:
        print(f"Attempting connection to n8n at: {settings.N8N_WEBHOOK_URL}")
        async with httpx.AsyncClient(timeout=2.0) as client:
            try:
                response = await client.post(
                    settings.N8N_WEBHOOK_URL,
                    json=payload.model_dump(),
                    headers={"Content-Type": "application/json"},
                )
                response.raise_for_status()
            except Exception:
                if settings.DEMO_FALLBACK_MODE:
                    logger.warning("n8n unreachable. Engaging local demo fallback.")
                    return DemoFallbackService.execute_fallback(payload.node_id, payload.anomaly_type)

        twin_success = await TwinSyncService.update_twin_state(payload.node_id, payload.anomaly_type)

        if not twin_success and settings.DEMO_FALLBACK_MODE:
            return DemoFallbackService.execute_fallback(payload.node_id, payload.anomaly_type)

        return {
            "status": "success",
            "node_id": payload.node_id,
            "action_taken": f"Processed anomaly '{payload.anomaly_type}' successfully. NetworkX state re-balanced.",
            "fallback_engaged": False,
            "twin_state_updated": twin_success,
            "details": {
                "severity": payload.severity,
                "metadata_received": payload.metadata
            }
        }
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        if settings.DEMO_FALLBACK_MODE:
            return DemoFallbackService.execute_fallback(payload.node_id, payload.anomaly_type)
        raise HTTPException(status_code=500, detail=str(e))