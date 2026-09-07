# Telemetry engine — backend/telemetry + backend/ml

Implements FR-1, FR-3, and FR-4 from `docs/SRS.md`: the digital twin state
engine, the Monte Carlo stochastic simulation, and the Isolation Forest
anomaly scorer. This is the backend the frontend and the swarm engine
both read from (single unified app: `backend/main.py`).

## Setup

```bash
pip install -r requirements.txt          # repo root
uvicorn backend.main:app --port 8000
```

Visit `http://127.0.0.1:8000/docs` for interactive Swagger docs.

## Endpoints owned by this branch

| Endpoint | Method | Notes |
| :--- | :--- | :--- |
| `/api/v1/telemetry/live` | GET | Single-shot poll of current metric vector (SRS 5.1) |
| `/api/v1/telemetry/stream` | GET (SSE) | Same data, pushed every ~1s for the frontend terminal drawer (FR-8.1) |
| `/api/v1/simulation/start` | POST | Runs the vectorized 100k-permutation Monte Carlo engine (SRS 5.2) |
| `/api/v1/telemetry/reset` | POST | Support hook for Person 4 — call after n8n returns 200 OK (FR-7.3) |

## File map (all under `backend/`)

- `models/twin_schemas.py` — Pydantic models. This is the actual API contract;
  keep it in sync with `docs/SRS.md` section 5 if anything changes, since
  the swarm engine and frontend build against these shapes.
- `telemetry/state.py` — `DigitalTwinState`: in-memory node state machine
  (NOMINAL/DEGRADED/CRITICAL) and synthetic metric generation. Swap the
  synthetic generator for a real OTel collector adapter later without
  touching `main.py`.
- `ml/anomaly.py` — Isolation Forest scorer (FR-4), bootstrapped on
  synthetic nominal traffic so it returns sane scores from the first
  request, and refits periodically as history accumulates.
- `telemetry/simulation.py` — Fully vectorized (numpy, no per-permutation Python
  loop) Monte Carlo engine. This is what makes NFR-1.2 (100k permutations
  under 3s) achievable — the current build runs in well under 0.1s.
- `main.py` — FastAPI wiring: background polling loop + endpoints.

## Integration notes for the rest of the team

- **Person 2 (swarm engine):** poll `/api/v1/telemetry/live` or subscribe
  to `/api/v1/telemetry/stream` for `LogAgent` input. `failing_node` tells
  you which topology node to focus triage on.
- **Person 3 (frontend):** `/api/v1/telemetry/stream` is a standard SSE
  endpoint — `new EventSource(url)` and listen for the `telemetry` event.
- **Person 4 (n8n automation):** once your webhook handler confirms the
  patch, call `POST /api/v1/telemetry/reset` so this service's state
  matches the "all nodes NOMINAL" outcome you report back (FR-7.3).

## Known simplifications (flag if these need to change before demo day)

- Telemetry is synthetic, not real OTel/Prometheus ingestion (FR-1.2 says
  "parse OpenTelemetry-compliant metrics schemas" — this build simulates
  that shape but doesn't parse real OTel exports yet).
- Chaos injection currently always targets `cbs-db-primary` regardless of
  `chaos_type`; extend `simulation.py`'s `run_simulation` if you need the
  frontend demo to visibly attack a different node per chaos profile.

## Measured accuracy & efficiency

See `backend/ml/eval_anomaly_accuracy.py` (run with
`python -m backend.ml.eval_anomaly_accuracy` from the repo root after
`pip install -r requirements.txt`) for the anomaly-detector numbers
below. There's no real labeled production data yet, so this evaluates
against a synthetic test set built from the same nominal/attacked
distributions `telemetry.py` uses internally — treat these as a sanity
check on the detector's separation ability, not a production accuracy
claim.

**Anomaly detector (1000 samples, 500 nominal / 500 attacked, threshold=0.65):**
- Precision 0.82, Recall 0.88, F1 0.85, ROC-AUC 0.94
- Nominal traffic scores mean 0.40 (std 0.25); attacked traffic scores
  mean 0.90 (std 0.16) — good separation but not perfect, so expect
  occasional false CRITICAL flips on noisy-but-normal traffic and
  occasional missed detections on borderline attacks.
- **This required a fix.** The original score-normalization formula
  assumed `decision_function`'s raw output spanned roughly [-0.5, 0.5];
  empirically, for this feature scale it only spans about [-0.1, 0.1],
  which collapsed every anomaly score to ~0.45-0.55 and meant the 0.65
  threshold could never trigger. Fixed by calibrating the rescale bounds
  from the 2nd/98th percentile of the model's own training-data raw
  scores each time it fits or refits, instead of a hardcoded constant.

**Simulation engine (Monte Carlo, vectorized with numpy):**
| Permutations | Wall time |
| :--- | :--- |
| 1,000 | ~0.001s |
| 10,000 | ~0.001s |
| 50,000 | ~0.006s |
| 100,000 | ~0.01-0.02s |
| 200,000 | ~0.02s |

NFR-1.2 requires the 100k run to finish under 3.0s — this comes in ~150-300x
under that budget, so there's headroom to make the chaos model more
detailed (more profiles, correlated failure cascades) without risking the
NFR.

**API latency:** `GET /api/v1/telemetry/live` end-to-end (network +
serialization + compute) averaged ~1.1ms over 20 requests, well under the
1.5s NFR-1.1 ceiling.
