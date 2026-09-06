from pydantic import BaseModel, Field
from typing import List
from backend.models.node import TopologyNode

class TelemetrySnapshot(BaseModel):
    timestamp: float
    total_throughput_rps: float = Field(..., ge=0.0)
    active_incidents: int = Field(0, ge=0)
    nodes: List[TopologyNode]
