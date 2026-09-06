from pydantic import BaseModel, Field
from typing import List, Optional

class PatchOption(BaseModel):
    config_id: str = Field(..., example="Config A: Reroute Traffic")
    risk_score: float = Field(..., ge=0.0, le=1.0)
    disruption_score: float = Field(..., ge=0.0, le=1.0)
    latency_impact_ms: float
    estimated_cost: float
    description: str

class IncidentPayload(BaseModel):
    incident_id: str = Field(..., example="INC-9042")
    target_node_id: str = Field(..., example="auth-service-01")
    root_cause: str = Field(..., example="Connection pool size exhausted under burst load")
    suspect_commit: str = Field(..., example="Commit #84f2 - Reduced max_connections pool size")
    attack_probability: float = Field(..., ge=0.0, le=1.0)
    patch_options: List[PatchOption]
    selected_config: Optional[str] = None
