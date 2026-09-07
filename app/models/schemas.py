from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class AnomalyTriggerPayload(BaseModel):
    node_id: str = Field(..., description="Target node ID in the NetworkX digital twin")
    anomaly_type: str = Field(..., description="Type of failure (e.g., latency_spike, packet_loss, node_offline)")
    severity: str = Field("medium", description="Severity level: low, medium, high, critical")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional telemetry context from Person 1/2")

class HealingResponseSchema(BaseModel):
    status: str
    node_id: str
    action_taken: str
    fallback_engaged: bool
    twin_state_updated: bool
    details: Dict[str, Any]