import re
import uuid
from typing import Optional
from backend.models.incident import IncidentEvent

class LogParser:
    def __init__(self):
        self.buffer = []

    def parse_log(self, log_entry: str) -> Optional[IncidentEvent]:
        """
        Parses a raw log string. If a critical failure is detected,
        it returns a validated IncidentEvent.
        """
        # Extract basic severity and node_id using regex
        severity_match = re.search(r"\[(CRITICAL|ERROR|WARN|INFO)\]", log_entry)
        node_match = re.search(r"node_id=([\w-]+)", log_entry)

        severity = severity_match.group(1) if severity_match else "INFO"
        node_id = node_match.group(1) if node_match else "unknown"

        if severity in ["CRITICAL", "ERROR"]:
            incident = IncidentEvent(
                incident_id=f"INC-{uuid.uuid4().hex[:8]}",
                affected_nodes=[node_id] if node_id != "unknown" else [],
                severity=severity,
                raw_logs=log_entry
            )
            self.buffer.append(incident)
            return incident

        return None
