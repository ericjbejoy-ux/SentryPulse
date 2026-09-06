from pydantic import BaseModel, Field
from typing import Optional

class NodeState(BaseModel):
    node_id: str = Field(..., description="Unique identifier for the infrastructure node")
    node_type: str = Field(..., description="Type of node (e.g., 'database', 'api_gateway')")
    status: str = Field(default="healthy", description="Current health status (healthy, critical, standby)")
    latency_ms: Optional[float] = Field(default=None, description="Current response latency in milliseconds")
