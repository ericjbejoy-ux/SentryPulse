from pydantic import BaseModel, Field
from typing import List

class IncidentEvent(BaseModel):
    incident_id: str = Field(..., description="Unique identifier for the generated incident")
    affected_nodes: List[str] = Field(..., description="List of node_ids impacted by the failure")
    severity: str = Field(..., description="Severity level (e.g., 'high', 'critical')")
    raw_logs: str = Field(..., description="String block of the captured error logs")
