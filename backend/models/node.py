from pydantic import BaseModel, Field
from typing import List

class TopologyNode(BaseModel):
    id: str = Field(..., example="auth-service-01")
    label: str = Field(..., example="Auth Gateway")
    type: str = Field(..., example="microservice")  # "gateway" | "microservice" | "database" | "load_balancer"
    status: str = Field("healthy", example="healthy")  # "healthy" | "warning" | "critical" | "offline"
    latency_ms: float = Field(0.0, ge=0.0, example=12.5)
    error_rate: float = Field(0.0, ge=0.0, le=100.0, example=0.5)
    cpu_usage: float = Field(0.0, ge=0.0, le=100.0, example=42.0)
    connected_to: List[str] = Field(default_factory=list, example=["db-primary-01", "cache-redis-01"])
