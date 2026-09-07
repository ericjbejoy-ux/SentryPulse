import re
import uuid
import json
from typing import Optional
from backend.models.incident import IncidentEvent
from backend.models.telemetry import TelemetryPayload
from backend.telemetry.twin import digital_twin

class LogParser:
    def __init__(self):
        self.buffer = []
        self.log_pattern = re.compile(
            r'\[(?P<timestamp>.*?)\]\s+(?P<severity>CRITICAL|ERROR|WARN|INFO)\s+node_id=(?P<node_id>[\w-]+)\s+Metrics:(?P<metrics>\{.*?\})'
        )

    async def parse_and_process(self, log_entry: str) -> Optional[IncidentEvent]:
        try:
            # 1. Attempt structured regex parse capturing embedded metrics
            match = self.log_pattern.search(log_entry)
            if match:
                group_dict = match.groupdict()
                timestamp = group_dict.get("timestamp", "unknown")
                severity = group_dict.get("severity", "INFO")
                node_id = group_dict.get("node_id")
                metrics_str = group_dict.get("metrics", "{}")

                # Push metrics update directly into the digital twin
                if node_id and node_id != "unknown":
                    metrics = json.loads(metrics_str)
                    await digital_twin.ingest_telemetry(
                        TelemetryPayload(timestamp=timestamp, source_node=node_id, metrics=metrics)
                    )

                if severity in ["CRITICAL", "ERROR"]:
                    incident = IncidentEvent(
                        incident_id=f"INC-{uuid.uuid4().hex[:8]}",
                        affected_nodes=[node_id],
                        severity=severity,
                        raw_logs=log_entry
                    )
                    self.buffer.append(incident)
                    return incident

            else:
                # 2. Fallback to lighter regex parsing if standard format fails
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

        except Exception as e:
            pass # Log parsing failures shouldn't crash the server pipeline

        return None
