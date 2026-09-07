"""Unified twin schemas — canonical contract for the single-backend MVP.

Mirrors SRS2 section 5.1 / 5.2 JSON shapes exactly so the frontend,
swarm engine, and healing webhook share one stable contract.
Promoted from telemetry-engine/app/schemas.py (Person 1 deliverable).
"""
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class TwinNodeState(str, Enum):
    NOMINAL = "NOMINAL"
    DEGRADED = "DEGRADED"
    CRITICAL = "CRITICAL"


class TopologyNodeId(str, Enum):
    API_GATEWAY = "idfc-api-gateway"
    CORE_BANKING_SWITCH = "core-banking-switch"
    CBS_DB_PRIMARY = "cbs-db-primary"
    UPI_SETTLEMENT_CACHE = "upi-settlement-cache"


class TelemetrySnapshot(BaseModel):
    """Matches SRS 5.1 GET /api/v1/telemetry/live response body."""

    timestamp: str
    latency_ms: float
    cpu: str  # kept as "88%" string form to match the SRS example verbatim
    rps: int
    error_rate: float
    is_attacked: bool
    failing_node: Optional[str] = None


class NodeHealth(BaseModel):
    node_id: TopologyNodeId
    state: TwinNodeState
    anomaly_score: float = Field(ge=0.0, le=1.0)
    latency_ms: float
    cpu_pct: float
    rps: int
    error_rate: float


class SimulationRequest(BaseModel):
    """Matches SRS 5.2 POST /api/v1/simulation/start payload."""

    permutations: int = Field(default=100_000, le=200_000, gt=0)
    chaos_type: str = "THREADPOOL_LOCK"


class SimulationResult(BaseModel):
    """Matches SRS 5.2 POST /api/v1/simulation/start response."""

    status: str
    permutations_executed: int
    resilience_score: float
    vector_drift: str
    duration_seconds: float
