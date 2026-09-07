"""FR-4: Machine Learning Anomaly Detection (unified backend).

Promoted verbatim from telemetry-engine/app/anomaly.py. Small Isolation
Forest bootstrapped on synthetic nominal traffic, percentile-calibrated
into [0, 1], refit every 500 samples. FR-4.2 trip threshold is 0.65.
"""
import numpy as np
from sklearn.ensemble import IsolationForest


class AnomalyScorer:
    def __init__(self, warmup_samples: int = 200) -> None:
        self._warmup_samples = warmup_samples
        self._history: list[list[float]] = []
        self._model: IsolationForest | None = None
        self._raw_low = -0.1
        self._raw_high = 0.1
        self._fit_baseline()

    def _calibrate(self, raw_scores: np.ndarray) -> None:
        self._raw_low = float(np.percentile(raw_scores, 2))
        self._raw_high = float(np.percentile(raw_scores, 98))

    def _fit_baseline(self) -> None:
        rng = np.random.default_rng(seed=42)
        baseline = np.column_stack(
            [
                rng.uniform(20, 90, self._warmup_samples),
                rng.uniform(15, 45, self._warmup_samples),
                rng.uniform(0.0, 0.01, self._warmup_samples),
            ]
        )
        self._model = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42,
        )
        self._model.fit(baseline)
        self._calibrate(self._model.decision_function(baseline))
        self._history = baseline.tolist()

    def score(self, latency_ms: float, cpu_pct: float, error_rate: float) -> float:
        x = np.array([[latency_ms, cpu_pct, error_rate]])
        raw = self._model.decision_function(x)[0]
        span = max(self._raw_high - self._raw_low, 1e-9)
        score = 1.0 - ((raw - self._raw_low) / span)
        score = float(np.clip(score, 0.0, 1.0))

        self._history.append([latency_ms, cpu_pct, error_rate])
        if len(self._history) > 2000:
            self._history.pop(0)
        if len(self._history) % 500 == 0:
            self._refit()

        return score

    def _refit(self) -> None:
        data = np.array(self._history)
        self._model = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42,
        )
        self._model.fit(data)
        self._calibrate(self._model.decision_function(data))


# Module-level singleton shared across the polling loop.
anomaly_scorer = AnomalyScorer()
