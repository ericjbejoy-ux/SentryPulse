"""Shared helpers for the demo-site victim services.

Every service tracks REAL request metrics (latency / RPS / error rate) and
exposes them via GET /metrics, plus a fault-injection surface via
POST /fault. SentryPulse polls /metrics through backend/telemetry/adapter.py.
"""
import hashlib
import os
import threading
import time
from collections import deque
from typing import Deque, Dict, Optional

import psutil

# Tunable real work per request. Sized so nominal end-to-end latency lands
# in the 20-90ms band the SentryPulse anomaly scorer was trained on.
WORK_UNITS = int(os.getenv("WORK_UNITS", "18"))


def do_real_work(units: int = WORK_UNITS) -> None:
    """CPU-bound work (PBKDF2) — genuine processing time, not a sleep."""
    hashlib.pbkdf2_hmac("sha256", b"sentrypulse-ledger", b"salt", units * 1000)


class FaultState:
    """Process-local fault injection state with automatic expiry."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.extra_latency_ms: float = 0.0
        self.deadlock: bool = False
        self._expires_at: float = 0.0

    def inject(self, fault: str, latency_ms: float = 0.0, duration_s: float = 30.0) -> None:
        with self._lock:
            self._expires_at = time.time() + duration_s
            if fault == "latency":
                self.extra_latency_ms = latency_ms
            elif fault == "deadlock":
                self.deadlock = True

    def clear(self) -> None:
        with self._lock:
            self.extra_latency_ms = 0.0
            self.deadlock = False
            self._expires_at = 0.0

    def snapshot(self) -> Dict[str, object]:
        with self._lock:
            if self._expires_at and time.time() > self._expires_at:
                self.extra_latency_ms = 0.0
                self.deadlock = False
                self._expires_at = 0.0
            return {
                "extra_latency_ms": self.extra_latency_ms,
                "deadlock": self.deadlock,
            }


class Metrics:
    """Rolling request metrics. All values measured, nothing synthesized."""

    def __init__(self, window_s: float = 5.0, max_samples: int = 500) -> None:
        self._lock = threading.Lock()
        self._window_s = window_s
        self._stamps: Deque[float] = deque()
        self._latencies: Deque[float] = deque(maxlen=max_samples)
        self._events: Deque[tuple] = deque(maxlen=2000)  # (timestamp, is_error)
        self._proc = psutil.Process()
        self._proc.cpu_percent(interval=None)  # prime the counter

    def record(self, latency_s: float, error: bool) -> None:
        now = time.time()
        with self._lock:
            self._stamps.append(now)
            self._latencies.append(latency_s * 1000.0)
            self._events.append((now, error))

    def snapshot(self) -> Dict[str, float]:
        now = time.time()
        with self._lock:
            while self._stamps and now - self._stamps[0] > self._window_s:
                self._stamps.popleft()
            rps = len(self._stamps) / self._window_s
            lats = sorted(self._latencies)
            if lats:
                p95 = lats[min(len(lats) - 1, int(len(lats) * 0.95))]
                avg = sum(lats) / len(lats)
                latency_ms = round(0.5 * avg + 0.5 * p95, 1)
            else:
                latency_ms = 0.0
            # Windowed error rate: pruned with the traffic window so the
            # ratio decays within seconds of recovery, not over the
            # lifetime of the process.
            recent = [(ts, err) for ts, err in self._events if now - ts <= self._window_s]
            error_rate = round(
                sum(1 for _, err in recent if err) / max(len(recent), 1), 4
            )
        try:
            cpu_pct = round(self._proc.cpu_percent(interval=None), 1)
        except Exception:
            cpu_pct = 0.0
        return {
            "latency_ms": latency_ms,
            "cpu_pct": cpu_pct,
            "rps": int(round(rps)),
            "error_rate": error_rate,
        }


fault = FaultState()


def apply_fault_delay() -> None:
    """Sleep off any injected latency. Raises on deadlock fault."""
    snap = fault.snapshot()
    if snap["deadlock"]:
        raise TimeoutError("injected threadpool deadlock")
    extra = float(snap["extra_latency_ms"] or 0.0)
    if extra > 0:
        time.sleep(extra / 1000.0)


def current_fault() -> Optional[Dict[str, object]]:
    snap = fault.snapshot()
    if snap["extra_latency_ms"] or snap["deadlock"]:
        return snap
    return None
