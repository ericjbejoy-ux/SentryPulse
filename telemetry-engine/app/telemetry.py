"""
FR-1: Digital Twin State Engine & Telemetry Ingestion

In production this module would parse OTel metric exports (FR-1.2). For the
hackathon/demo build there is no real OTel collector wired up yet, so this
generates realistic synthetic telemetry per topology node and exposes the
same interface a real ingestion adapter would. Swap `_read_real_otel()` in
later without touching any downstream consumer (anomaly.py, main.py, or the
frontend) since they only depend on TelemetrySnapshot / NodeHealth shapes.
"""
import random
import time
from datetime import datetime, timezone
from typing import Dict

from .schemas import NodeHealth, NodeState, TelemetrySnapshot, TopologyNodeId

# FR-4.2: anomaly score threshold that trips NOMINAL -> CRITICAL
CRITICAL_ANOMALY_THRESHOLD = 0.65
DEGRADED_ANOMALY_THRESHOLD = 0.35


class DigitalTwinState:
    """
    Holds the live in-memory state space object for every topology node
    (FR-1.3). This is the single source of truth that both the
    /telemetry/live endpoint and the SSE /telemetry/stream endpoint read
    from, so they never disagree with each other.
    """

    def __init__(self) -> None:
        self._nodes: Dict[TopologyNodeId, NodeHealth] = {
            node_id: NodeHealth(
                node_id=node_id,
                state=NodeState.NOMINAL,
                anomaly_score=0.0,
                latency_ms=random.uniform(20, 60),
                cpu_pct=random.uniform(15, 35),
                rps=random.randint(500, 2000),
                error_rate=0.0,
            )
            for node_id in TopologyNodeId
        }
        self._attacked_node: TopologyNodeId | None = None

    def inject_chaos(self, target: TopologyNodeId) -> None:
        """Used by the simulation engine (FR-3.2) to force a node degraded."""
        self._attacked_node = target

    def clear_chaos(self) -> None:
        """Used by FR-7.3 self-healing reset once a webhook confirms 200 OK."""
        self._attacked_node = None
        for node_id in self._nodes:
            self._nodes[node_id] = NodeHealth(
                node_id=node_id,
                state=NodeState.NOMINAL,
                anomaly_score=round(random.uniform(0.0, 0.1), 3),
                latency_ms=round(random.uniform(20, 60), 1),
                cpu_pct=round(random.uniform(15, 35), 1),
                rps=random.randint(500, 2000),
                error_rate=0.0,
            )

    def tick(self, anomaly_scorer) -> None:
        """
        One polling cycle (FR-1.1: sub-second polling intervals).
        Advances every node's synthetic metrics, scores them for anomalies,
        and updates node state per the FR-4 threshold rules.
        """
        for node_id in self._nodes:
            is_attacked = node_id == self._attacked_node
            latency = random.uniform(300, 800) if is_attacked else random.uniform(20, 90)
            cpu = random.uniform(75, 99) if is_attacked else random.uniform(15, 45)
            rps = random.randint(15000, 30000) if is_attacked else random.randint(500, 2500)
            error_rate = random.uniform(0.02, 0.08) if is_attacked else random.uniform(0.0, 0.01)

            score = anomaly_scorer.score(latency, cpu, error_rate)

            if score >= CRITICAL_ANOMALY_THRESHOLD:
                state = NodeState.CRITICAL
            elif score >= DEGRADED_ANOMALY_THRESHOLD:
                state = NodeState.DEGRADED
            else:
                state = NodeState.NOMINAL

            self._nodes[node_id] = NodeHealth(
                node_id=node_id,
                state=state,
                anomaly_score=round(score, 3),
                latency_ms=round(latency, 1),
                cpu_pct=round(cpu, 1),
                rps=rps,
                error_rate=round(error_rate, 4),
            )

    def as_flat_snapshot(self) -> TelemetrySnapshot:
        """
        Collapses the multi-node state into the single flat shape defined
        in SRS 5.1 (GET /api/v1/telemetry/live). Reports whichever node is
        currently worst-off as `failing_node`.
        """
        worst_node = max(self._nodes.values(), key=lambda n: n.anomaly_score)
        return TelemetrySnapshot(
            timestamp=datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3] + "Z",
            latency_ms=worst_node.latency_ms,
            cpu=f"{worst_node.cpu_pct:.0f}%",
            rps=worst_node.rps,
            error_rate=worst_node.error_rate,
            is_attacked=self._attacked_node is not None,
            failing_node=worst_node.node_id.value if worst_node.state != NodeState.NOMINAL else None,
        )

    def as_node_list(self) -> list[NodeHealth]:
        return list(self._nodes.values())


# Module-level singleton shared by main.py's polling loop and both endpoints.
twin_state = DigitalTwinState()
