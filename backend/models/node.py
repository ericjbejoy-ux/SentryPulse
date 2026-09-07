from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any

class NodeState(BaseModel):
    model_config = ConfigDict(extra="allow")

    node_id: str = Field(..., description="Unique identifier for the infrastructure node")
    node_type: str = Field(..., description="Type of node (e.g., 'database', 'api_gateway')")
    status: str = Field(default="healthy", description="Current health status (healthy, critical, standby)")
    latency_ms: Optional[float] = Field(default=None, description="Current response latency in milliseconds")
    cpu_load: Optional[float] = Field(default=0.0, description="Current CPU utilization percentage")
    error_rate: Optional[float] = Field(default=0.0, description="Current error rate percentage")
    cost_per_hour: Optional[float] = Field(default=0.0, description="Operational cost weight for optimization")
