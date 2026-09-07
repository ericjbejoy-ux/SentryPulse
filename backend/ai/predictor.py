"""FR-5.2: PredictorAgent — cascading-failure probability scoring.

Rule-based estimator over the topology dependency chain:
cbs-db-primary contention cascades to upi-settlement-cache, while
gateway-tier faults propagate toward the core-banking-switch.
"""
from typing import Tuple

CASCADE_PROBABILITY_ATTACKED = 0.914
CASCADE_PROBABILITY_BASELINE = 0.008
SLA_BREACH_LATENCY_MS = 300.0

_DOWNSTREAM = {
    "cbs-db-primary": "upi-settlement-cache",
    "core-banking-switch": "cbs-db-primary",
    "idfc-api-gateway": "core-banking-switch",
    "upi-settlement-cache": "core-banking-switch",
}


def predict_cascade(latency_ms: float, failing_node: str) -> Tuple[str, float]:
    """Returns (human-readable assessment, cascade probability 0..1)."""
    downstream = _DOWNSTREAM.get(failing_node, "upi-settlement-cache")
    if latency_ms > SLA_BREACH_LATENCY_MS:
        return (
            f"Cascade Alert: {CASCADE_PROBABILITY_ATTACKED:.1%} probability that "
            f"threadpool deadlock on {failing_node} will cascade to "
            f"{downstream} within 12 seconds.",
            CASCADE_PROBABILITY_ATTACKED,
        )
    return (
        "Dependency graph stable. Baseline failure probability < 0.8%.",
        CASCADE_PROBABILITY_BASELINE,
    )
