"""FR-3: Stochastic Monte Carlo Simulation Engine (unified backend).

Promoted verbatim from telemetry-engine/app/simulation.py. Fully
vectorized with numpy so the 100k-permutation run completes in well
under the NFR-1.2 3.0s budget.
"""
import time

import numpy as np

from backend.models.twin_schemas import SimulationRequest, SimulationResult

# Each chaos_type maps to (mean, std) of the extra latency/error burden
# it injects per simulated request, calibrated against SRS section 2 tiers.
CHAOS_PROFILES = {
    "THREADPOOL_LOCK": {"latency_mean": 420, "latency_std": 140, "error_mean": 0.06},
    "LATENCY_SPIKE": {"latency_mean": 650, "latency_std": 220, "error_mean": 0.03},
    "SCHEMA_DRIFT": {"latency_mean": 180, "latency_std": 60, "error_mean": 0.09},
    "PAYLOAD_SATURATION": {"latency_mean": 300, "latency_std": 180, "error_mean": 0.12},
}
DEFAULT_PROFILE = CHAOS_PROFILES["THREADPOOL_LOCK"]

# A permutation "survives" if latency stays under this SLA ceiling.
SLA_LATENCY_CEILING_MS = 500.0


def run_simulation(req: SimulationRequest) -> SimulationResult:
    start = time.perf_counter()
    profile = CHAOS_PROFILES.get(req.chaos_type, DEFAULT_PROFILE)
    n = req.permutations

    rng = np.random.default_rng()

    latencies = rng.normal(profile["latency_mean"], profile["latency_std"], size=n)
    latencies = np.clip(latencies, 5, None)
    error_trips = rng.random(n) < profile["error_mean"]

    survived = (latencies < SLA_LATENCY_CEILING_MS) & (~error_trips)
    resilience_score = float(survived.mean() * 100)

    if resilience_score < 70:
        vector_drift = "CRITICAL_ANOMALY_DETECTED"
    elif resilience_score < 90:
        vector_drift = "MODERATE_DRIFT_DETECTED"
    else:
        vector_drift = "NOMINAL"

    duration = time.perf_counter() - start

    return SimulationResult(
        status="COMPLETED",
        permutations_executed=n,
        resilience_score=round(resilience_score, 1),
        vector_drift=vector_drift,
        duration_seconds=round(duration, 3),
    )
