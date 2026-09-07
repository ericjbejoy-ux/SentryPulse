import logging
from typing import Dict, Any

logger = logging.getLogger("uvicorn.error")

class DemoFallbackService:
    @staticmethod
    def execute_fallback(node_id: str, anomaly_type: str) -> Dict[str, Any]:
        logger.warning(f"[FALLBACK ENGAGED] Simulating recovery for node {node_id} due to {anomaly_type}")
        return {
            "status": "success",
            "node_id": node_id,
            "action_taken": f"Isolated {node_id}, rerouted traffic via edge mesh, and initiated container auto-heal.",
            "fallback_engaged": True,
            "twin_state_updated": True,
            "details": {
                "simulated": True,
                "rerouted_to": "edge_backup_node_02",
                "latency_delta_ms": -14.2,
                "reason": "Live n8n webhook or telemetry bridge timeout bypassed."
            }
        }