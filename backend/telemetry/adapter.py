"""Live-victim adapter: feeds demo-site /metrics into the twin (FR-1.2).

Active only when DEMO_SITE_URL is set (supervisor base, e.g.
http://127.0.0.1:8004). Each poll cycle it:

1. GETs /metrics from :8001/:8002/:8003 (httpx, short timeout).
2. Scores each node with the shared IsolationForest scorer.
3. Writes REAL measured values + score via twin.apply_live_sample().

Honesty note — fixed linear calibration: the scorer was trained on a
synthetic reference workload whose nominal centroid is (lat 55ms,
cpu 30%), while the real victim's nominal centroids (measured under
100 RPS load, 2026-09-08) are:

    gateway (idfc-api-gateway):       lat 42.6ms, cpu 41.5%
    api (core-banking-switch):        lat 24.2ms, cpu 44.5%
    dbsim (cbs-db-primary):           lat  3.2ms, cpu 19.0%

The adapter subtracts the real centroid and adds the training centroid
before scoring, so genuine deviations (faults) still score far
out-of-band while the healthy baseline scores nominal. Displayed twin
metrics are ALWAYS the raw measured values — only the scorer input is
calibrated. upi-settlement-cache has no victim process and keeps its
synthetic tick.

CPU is neutralized in live scoring (pinned to the training centroid):
per-process CPU % is too noisy on shared demo boxes (SentryPulse +
victim + loadgen compete for the same cores), while request latency is
deterministic and carries the fault signal. Error rate passes through
untouched, so kills/deadlocks still trip via errors. A pure-CPU fault
alone will not trip live detection — documented limitation.

Special cases (no scorer involved):
- service unreachable -> CRITICAL, error_rate=1.0 (real kill detection)
- rps == 0 (idle, no traffic) -> NOMINAL, score 0.05 (nothing happening)
- first 3 polls after idle->traffic transition -> capped at 0.15 while
  psutil CPU counters and the EMA settle (warmup, no false trips)
"""
import logging
from typing import Dict, Optional, Tuple

import httpx

from backend.ml.anomaly import AnomalyScorer
from backend.models.twin_schemas import TopologyNodeId, TwinNodeState

logger = logging.getLogger("uvicorn.error")

# Dedicated scorer: live traffic must not share session history with the
# synthetic loop (fault samples would poison the baseline via refit), and
# refit is disabled outright so sustained faults can't dull CRITICAL.
live_scorer = AnomalyScorer(refit_interval=None)

# Detector floor: exact-0.0 error vectors isolate in the forest no matter
# the latency (measured 0.45-0.67 across the nominal band), while 0.003
# sits deep in-basin (0.04-0.17). Real faults produce 2-100% errors, so a
# 0.3% floor masks nothing. Displayed error_rate stays exact.
ERROR_FLOOR = 0.003

TRAIN_CENTROID: Tuple[float, float] = (55.0, 30.0)

# node -> (metrics port, real-lat centroid, real-cpu centroid)
# NOTE: 3 victims only. upi-settlement-cache has no victim process and is
# excluded from the live graph entirely (it keeps ticking synthetically
# inside the twin, invisible until synthetic mode returns).
LIVE_NODES: Dict[TopologyNodeId, Tuple[int, float, float]] = {
    TopologyNodeId.API_GATEWAY: (8001, 42.6, 41.5),
    TopologyNodeId.CORE_BANKING_SWITCH: (8002, 24.2, 44.5),
    TopologyNodeId.CBS_DB_PRIMARY: (8003, 3.2, 19.0),
}

IDLE_SCORE = 0.05
DOWN_SCORE = 1.0
EMA_ALPHA = 0.4

_ema: Dict[TopologyNodeId, Optional[Tuple[float, float, float]]] = {
    node: None for node in LIVE_NODES
}

# Consecutive scorable polls per node. A node coming back from idle needs
# a few polls before psutil CPU counters and the EMA settle; those warmup
# polls are capped at nominal so the transition never false-trips.
WARMUP_POLLS = 3
WARMUP_SCORE_CAP = 0.15
_active: Dict[TopologyNodeId, int] = {node: 0 for node in LIVE_NODES}


def calibrate(node: TopologyNodeId, latency_ms: float, cpu_pct: float) -> Tuple[float, float]:
    """Fixed linear map for latency; CPU pinned (see module docstring)."""
    _, lat_c, _ = LIVE_NODES[node]
    cal_lat = max(1.0, min(2000.0, latency_ms - lat_c + TRAIN_CENTROID[0]))
    return cal_lat, TRAIN_CENTROID[1]


def smooth(node: TopologyNodeId, sample: Tuple[float, float, float]) -> Tuple[float, float, float]:
    prev = _ema[node]
    if prev is None:
        _ema[node] = sample
        return sample
    out = tuple(a * EMA_ALPHA + p * (1.0 - EMA_ALPHA) for a, p in zip(sample, prev))
    _ema[node] = out
    return out  # type: ignore[return-value]


def reset_smoothing() -> None:
    for node in _ema:
        _ema[node] = None


async def poll_and_apply(twin_state, supervisor_url: str) -> str:
    """One live poll cycle. Returns 'demo-site' (or raises on total failure)."""
    from urllib.parse import urlparse

    host = urlparse(supervisor_url).hostname or "127.0.0.1"
    applied = 0
    async with httpx.AsyncClient(timeout=1.5) as client:
        # upi-settlement-cache has no victim: keep it ticking synthetically
        # (hidden from the live graph until synthetic mode returns).
        twin_state.tick_subset(live_scorer, {TopologyNodeId.UPI_SETTLEMENT_CACHE})
        for node, (port, _, _) in LIVE_NODES.items():
            try:
                resp = await client.get(f"http://{host}:{port}/metrics")
                resp.raise_for_status()
                m = resp.json()
                lat = float(m.get("latency_ms", 0.0))
                cpu = float(m.get("cpu_pct", 0.0))
                rps = int(m.get("rps", 0))
                err = float(m.get("error_rate", 0.0))
            except Exception as exc:
                logger.warning("demo-site :%s unreachable (%s) -> CRITICAL", port, exc)
                _active[node] = 0
                twin_state.apply_live_sample(node, 0.0, 0.0, 0, 1.0, DOWN_SCORE)
                # A dead victim IS an attack on the twin for sim-state purposes.
                twin_state.inject_chaos(node)
                applied += 1
                continue
            if rps == 0:
                _active[node] = 0
                twin_state.apply_live_sample(node, lat, cpu, 0, err, IDLE_SCORE)
                applied += 1
                continue
            cal_lat, cal_cpu = calibrate(node, lat, cpu)
            s_lat, s_cpu, s_err = smooth(node, (cal_lat, cal_cpu, err))
            score = live_scorer.score(s_lat, s_cpu, max(s_err, ERROR_FLOOR))
            _active[node] += 1
            if _active[node] < WARMUP_POLLS:
                score = min(score, WARMUP_SCORE_CAP)
            twin_state.apply_live_sample(node, lat, cpu, rps, err, score)
            applied += 1
    if applied == 0:
        raise RuntimeError("demo-site adapter applied nothing")
    return "demo-site"
