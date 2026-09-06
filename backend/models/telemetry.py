from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, Any, Optional
from datetime import datetime

class TelemetryPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Timestamp of the telemetry event")
    source_node: str = Field(..., description="The node_id generating the telemetry")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Key-value pairs of raw metrics (cpu, memory, connections)")
    event_type: Optional[str] = Field(default="metric_update", description="Type of telemetry event (metric_update, warning, heartbeat)")
