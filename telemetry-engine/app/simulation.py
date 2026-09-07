"""
FR-3: Stochastic Monte Carlo Simulation Engine

NFR-1.2 requires the 100k-permutation run to complete in under 3.0 seconds.
A plain Python loop over 100,000 iterations will not hit that reliably, so
this is fully vectorized with numpy -- every permutation is a row in an
array and every chaos vector is applied to the whole array at once.
"""
import time

import numpy as np

from .schemas import SimulationRequest, SimulationResult

# Each chaos_type maps to (mean, std) of the extra latency/error burden (in ms
# / fraction) it injects per simulated request, calibrated against the node
# tiers in SRS section 2.
CHAOS_PROFILES = {
    "THREADPOOL_LOCK": {"latency_mean": 420, "latency_std": 140, "error_mean": 0.06},
    "LATENCY_SPIKE": {"latency_mean": 650, "latency_std": 220, "error_mean": 0.03},
    "SCHEMA_DRIFT": {"latency_mean": 180, "latency_std": 60, "error_mean": 0.09},
    "PAYLOAD_SATURATION": {"latency_mean": 300, "latency_std": 180, "error_mean": 0.12},
}
DEFAULT_PROFILE = CHAOS_PROFILES["THREADPOOL_LOCK"]

# A permutation is judged "survived" if simulated latency stays under this
# SLA ceiling and no error is raised.
SLA_LATENCY_CEILING_MS = 500.0


def run_simulation(req: SimulationRequest) -> SimulationResult:
    start = time.perf_counter()
    profile = CHAOS_PROFILES.get(req.chaos_type, DEFAULT_PROFILE)
    n = req.permutations

    rng = np.random.default_rng()

    # Vectorized draw: one latency + one error-trip roll per permutation,
    # all n at once rather than a Python-level loop.
    latencies = rng.normal(profile["latency_mean"], profile["latency_std"], size=n)
    latencies = np.clip(latencies, 5, None)
    error_trips = rng.random(n) < profile["error_mean"]

    survived = (latencies < SLA_LATENCY_CEILING_MS) & (~error_trips)
    resilience_score = float(survived.mean() * 100)

    # Vector Drift (FR-3.3): how far the simulated distribution has moved
    # from a calm baseline, expressed as a qualitative flag the frontend
    # can color-code directly.
    p95_latency = float(np.percentile(latencies, 95))
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
