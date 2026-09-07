"""FR-1: Digital Twin State Engine & Telemetry Ingestion (unified backend).

Promoted verbatim from telemetry-engine/app/telemetry.py. In production
this would parse OTel metric exports (FR-1.2); the synthetic generator
below exposes the same TelemetrySnapshot / NodeHealth shapes so no
downstream consumer needs to change when a real adapter lands.
"""
import random
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional

from backend.models.twin_schemas import (
    NodeHealth,
    TelemetrySnapshot,
    TopologyNodeId,
    TwinNodeState,
)

# FR-4.2: anomaly score threshold that trips NOMINAL -> CRITICAL
CRITICAL_ANOMALY_THRESHOLD = 0.65
DEGRADED_ANOMALY_THRESHOLD = 0.35


class DigitalTwinState:
    """Live in-memory state space object for every topology node (FR-1.3).

    Single source of truth for /telemetry/live and /telemetry/stream.
    Thread-safe via a plain lock (tick loop + request handlers share it).
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._nodes: Dict[TopologyNodeId, NodeHealth] = {
            node_id: NodeHealth(
                node_id=node_id,
                state=TwinNodeState.NOMINAL,
                anomaly_score=0.0,
                latency_ms=random.uniform(20, 60),
                cpu_pct=random.uniform(15, 35),
                rps=random.randint(500, 2000),
                error_rate=0.0,
            )
            for node_id in TopologyNodeId
        }
        self._attacked_node: Optional[TopologyNodeId] = None

    def inject_chaos(self, target: TopologyNodeId) -> None:
        """Used by the simulation engine (FR-3.2) to force a node degraded."""
        with self._lock:
            self._attacked_node = target

    def clear_chaos(self) -> None:
        """FR-7.3 self-healing reset once a webhook confirms recovery."""
        with self._lock:
            self._attacked_node = None
            for node_id in self._nodes:
                self._nodes[node_id] = NodeHealth(
                    node_id=node_id,
                    state=TwinNodeState.NOMINAL,
                    anomaly_score=round(random.uniform(0.0, 0.1), 3),
                    latency_ms=round(random.uniform(20, 60), 1),
                    cpu_pct=round(random.uniform(15, 35), 1),
                    rps=random.randint(500, 2000),
                    error_rate=0.0,
                )

    def tick(self, anomaly_scorer) -> None:
        """One polling cycle (FR-1.1: sub-second polling intervals)."""
        with self._lock:
            for node_id in self._nodes:
                is_attacked = node_id == self._attacked_node
                latency = random.uniform(300, 800) if is_attacked else random.uniform(20, 90)
                cpu = random.uniform(75, 99) if is_attacked else random.uniform(15, 45)
                rps = random.randint(15000, 30000) if is_attacked else random.randint(500, 2500)
                error_rate = (
                    random.uniform(0.02, 0.08) if is_attacked else random.uniform(0.0, 0.01)
                )

                score = anomaly_scorer.score(latency, cpu, error_rate)

                if score >= CRITICAL_ANOMALY_THRESHOLD:
                    state = TwinNodeState.CRITICAL
                elif score >= DEGRADED_ANOMALY_THRESHOLD:
                    state = TwinNodeState.DEGRADED
                else:
                    state = TwinNodeState.NOMINAL

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
        """Collapse multi-node state into SRS 5.1 flat shape."""
        with self._lock:
            worst_node = max(self._nodes.values(), key=lambda n: n.anomaly_score)
            attacked = self._attacked_node is not None
            failing = (
                worst_node.node_id.value
                if worst_node.state != TwinNodeState.NOMINAL
                else None
            )
            return TelemetrySnapshot(
                timestamp=datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3] + "Z",
                latency_ms=worst_node.latency_ms,
                cpu=f"{worst_node.cpu_pct:.0f}%",
                rps=worst_node.rps,
                error_rate=worst_node.error_rate,
                is_attacked=attacked,
                failing_node=failing,
            )

    def as_node_list(self) -> List[NodeHealth]:
        with self._lock:
            return list(self._nodes.values())


# Module-level singleton shared by the polling loop and all endpoints.
twin_state = DigitalTwinState()
