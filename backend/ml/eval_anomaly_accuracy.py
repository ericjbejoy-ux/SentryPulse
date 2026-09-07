"""
Offline accuracy check for backend/ml/anomaly.py.

There is no real labeled production data yet (see docs/telemetry.md
"Known simplifications"), so this builds a labeled test set using the
exact same distributions backend/telemetry/state.py uses to simulate
NOMINAL vs. CRITICAL (attacked) traffic, then scores the detector
against it at the FR-4.2 threshold (0.65).

Run from the repo root:  python -m backend.ml.eval_anomaly_accuracy
"""
import numpy as np
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
)

from backend.ml.anomaly import AnomalyScorer


def main() -> None:
    rng = np.random.default_rng(seed=7)
    N_PER_CLASS = 500

    # Same ranges as state.py's tick(): nominal vs attacked
    normal_latency = rng.uniform(20, 90, N_PER_CLASS)
    normal_cpu = rng.uniform(15, 45, N_PER_CLASS)
    normal_err = rng.uniform(0.0, 0.01, N_PER_CLASS)

    attacked_latency = rng.uniform(300, 800, N_PER_CLASS)
    attacked_cpu = rng.uniform(75, 99, N_PER_CLASS)
    attacked_err = rng.uniform(0.02, 0.08, N_PER_CLASS)

    X = np.column_stack([
        np.concatenate([normal_latency, attacked_latency]),
        np.concatenate([normal_cpu, attacked_cpu]),
        np.concatenate([normal_err, attacked_err]),
    ])
    y_true = np.concatenate([np.zeros(N_PER_CLASS), np.ones(N_PER_CLASS)])

    scorer = AnomalyScorer()
    scores = np.array([scorer.score(lat, cpu, err) for lat, cpu, err in X])
    y_pred = (scores >= 0.65).astype(int)

    print(f"Test set: {N_PER_CLASS} nominal + {N_PER_CLASS} attacked samples\n")
    print("Confusion matrix [[TN, FP], [FN, TP]]:")
    print(confusion_matrix(y_true, y_pred))
    print(f"\nPrecision: {precision_score(y_true, y_pred):.3f}")
    print(f"Recall:    {recall_score(y_true, y_pred):.3f}")
    print(f"F1:        {f1_score(y_true, y_pred):.3f}")
    print(f"ROC-AUC:   {roc_auc_score(y_true, scores):.3f}")
    print(f"\nScore distribution — nominal: mean={scores[:N_PER_CLASS].mean():.3f} "
          f"std={scores[:N_PER_CLASS].std():.3f}")
    print(f"Score distribution — attacked: mean={scores[N_PER_CLASS:].mean():.3f} "
          f"std={scores[N_PER_CLASS:].std():.3f}")


if __name__ == "__main__":
    main()
