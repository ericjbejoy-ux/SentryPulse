from pydantic import BaseModel, Field
from typing import Dict, Any

class TelemetryPayload(BaseModel):
    timestamp: str = Field(..., description="ISO 8601 timestamp of the telemetry event")
    source_node: str = Field(..., description="The node_id generating the telemetry")
    metrics: Dict[str, Any] = Field(..., description="Key-value pairs of raw metrics (cpu, memory, connections)")
