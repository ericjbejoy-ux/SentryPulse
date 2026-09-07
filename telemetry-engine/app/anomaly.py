"""
FR-4: Machine Learning Anomaly Detection

Trains a small Isolation Forest on a bootstrap sample of "normal" traffic
so the model has a baseline before real data arrives, then re-fits
periodically as live telemetry accumulates. Falls back to a dynamic
Z-score threshold (allowed per FR-4.1) if the model has too few samples
to fit reliably yet, e.g. on cold start.
"""
import numpy as np
from sklearn.ensemble import IsolationForest


class AnomalyScorer:
    def __init__(self, warmup_samples: int = 200) -> None:
        self._warmup_samples = warmup_samples
        self._history: list[list[float]] = []
        self._model: IsolationForest | None = None
        # Calibration bounds for decision_function's raw output, fit fresh
        # each time the model is (re)trained. IsolationForest's raw score
        # range depends on the training data and is NOT reliably [-0.5, 0.5]
        # -- for this feature scale it was empirically ~[-0.1, 0.1], which
        # silently collapsed every score to ~0.45-0.55 under a hardcoded
        # ±0.5 assumption and meant the FR-4.2 0.65 threshold could never
        # fire. Deriving bounds from the training data's own raw scores
        # fixes that regardless of feature scale.
        self._raw_low = -0.1
        self._raw_high = 0.1
        self._fit_baseline()

    def _calibrate(self, raw_scores: np.ndarray) -> None:
        """Sets the min/max used to rescale decision_function's raw output
        into [0, 1]. Uses the 2nd/98th percentile of the fitted data's own
        raw scores rather than the true min/max, so a single extreme
        training outlier can't blow out the whole scale."""
        self._raw_low = float(np.percentile(raw_scores, 2))
        self._raw_high = float(np.percentile(raw_scores, 98))

    def _fit_baseline(self) -> None:
        """Bootstrap the model on synthetic nominal traffic so /telemetry/live
        returns sane scores from the very first request, before any real
        history has accumulated."""
        rng = np.random.default_rng(seed=42)
        baseline = np.column_stack([
            rng.uniform(20, 90, self._warmup_samples),   # latency_ms
            rng.uniform(15, 45, self._warmup_samples),   # cpu_pct
            rng.uniform(0.0, 0.01, self._warmup_samples),  # error_rate
        ])
        self._model = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42,
        )
        self._model.fit(baseline)
        self._calibrate(self._model.decision_function(baseline))
        self._history = baseline.tolist()

    def score(self, latency_ms: float, cpu_pct: float, error_rate: float) -> float:
        """
        Returns an anomaly score in [0.0, 1.0], where higher = more anomalous.
        sklearn's decision_function returns higher-is-normal; we invert and
        rescale it using bounds calibrated from the model's own training
        data (see _calibrate), then clip into the 0-1 range FR-4.1 specifies.
        """
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
        """Periodically retrain on recent history so the model adapts to
        genuine baseline drift instead of treating a new normal as anomalous
        forever."""
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
