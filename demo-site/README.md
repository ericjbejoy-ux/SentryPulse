# Demo-site — live victim stack for SentryPulse

A miniature BANKING SITE with REAL request metrics. Open it in a browser
tab next to the SentryPulse control room: break the site from one tab,
watch it fail in the other, cure it from the control room, watch it
recover. SentryPulse scores this traffic through its IsolationForest
twin instead of the synthetic generator.

```
browser :8001 (SentryBank page) ──/pay──▶ gateway ──▶ api ──▶ dbsim
browser :5173 (SentryPulse)      ◀── twin ◀── adapter polls /metrics
```

| File | Role |
| :--- | :--- |
| `common.py` | Shared rolling metrics + fault state (imported, not run) |
| `gateway.py` | `:8001` idfc-api-gateway — serves the SentryBank page (`/`), `/status` lights, `/account`; proxies `/pay` → api |
| `api.py` | `:8002` core-banking-switch — transfer + balance logic → dbsim |
| `dbsim.py` | `:8003` cbs-db-primary — ledger + bounded write pool |
| `site.html` | The browsable site: balance, Pay button, 3 status lights (served by gateway) |
| `supervisor.py` | `:8004` owns the 3 processes; `/restart/{svc}`, `/kill/{svc}` (restart max 1 / 10s) |
| `loadgen.py` | Traffic generator (`--rps 100 --duration 300`) |
| `faults.py` | Fault CLI: `latency`, `deadlock`, `kill`, `clear`, `status` (kill routes via supervisor) |
| `run.sh` | Starts the 3 services directly (no supervisor, no auto-heal) |

Setup: `pip install -r requirements.txt` (own venv recommended).
Linux only (SIGKILL fault + psutil port lookup).

## Standard demo (4 terminals + 2 tabs)

```bash
# T1  victim + supervisor
python supervisor.py
# T2  traffic (ALWAYS 100 rps — calibration baseline, see below)
python loadgen.py --rps 100 --duration 300
# T3  SentryPulse in live mode
DEMO_SITE_URL=http://127.0.0.1:8004 uvicorn backend.main:app --port 8000
# T4  frontend
npm run dev   # header shows ● BACKEND LIVE + GROQ ● LIVE SITE
```

Open **:8001** (SentryBank site) and **:5173** (control room) side by side.

Then, in the UI: the canvas shows the 3 live nodes (no redis, no
fictional nodes) each with its real PID. Break the site from the **☠️
Crash-test bar** — or just click around the **site tab**: Pay ₹10 works,
balance moves. Inject `Deadlock` on db from the Crash-bar → site tab
shows db red + Pay fails with the real `write pool exhausted` error →
control room auto-triages (Groq diagnosis appears, no clicks) and the
Pareto panel arms itself → one EXECUTE CURE heals **all** failing nodes
(PIDs change) → both tabs green, no refresh, no RUN needed. (RUN 100K is
disabled in live mode — it's the synthetic path.) Killing the gateway
kills the page itself: the tab shows an unreachable banner instead of
frozen greens. `python faults.py` remains as a CLI fallback.

`upi-settlement-cache` has no victim process and keeps synthetic data;
everything else on the canvas is measured.

## Calibration (read before tuning)

The scorer was trained on a synthetic reference workload, so the adapter
(`backend/telemetry/adapter.py`) applies a FIXED linear calibration
(measured at 100 RPS, 2026-09-08) mapping each service's nominal centroid
to the training centroid — deviations (faults) still score out-of-band,
and displayed metrics are always raw. Two deliberate compromises:

- **CPU pinned** at the training centroid for scoring: per-process CPU %
  is meaningless on shared demo boxes. Displayed CPU is real.
- **Error floor 0.003** for scoring: exact-0.0 vectors isolate in the
  forest regardless of latency. Displayed error rate is exact.
- **Idle (rps 0)** reports NOMINAL 0.05 without scoring; the first 3 polls
  after idle→traffic are capped at 0.15 (warmup, no false trips).
- Pure-CPU faults alone will NOT trip live detection (latency/error carry it).

Consequence: always run loadgen at `--rps 100`. Other sustained rates
shift CPU centroids and can false-trip. Re-measure centroids in
`adapter.py#LIVE_NODES` if you change RPS, work units (`WORK_UNITS` env),
or hardware class.

## E2E checklist (verified 2026-09-08, two-tab flow)

- [ ] `:8001/` shows balance + working Pay + 3 green lights, zero SentryPulse running
- [ ] UI shows 3-node live graph with real PIDs + ☠️ Crash-test bar, RUN disabled (synthetic mode: 8 nodes, RUN enabled, no bar)
- [ ] Crash-bar `Latency` on api → api+gateway CRITICAL ≤3 polls **with red edges/arrows**, db untouched
- [ ] Dead node cards show `DOWN — process unreachable`; erroring nodes show `SLO BREACH`; cascade shows `CASCADE RISK`
- [ ] Site tab during fault: degraded/red light + Pay slow or failing with the real error
- [ ] Crash-bar `Kill` on db → db CRITICAL error 1.0, chain DEGRADED/CRITICAL
- [ ] Killing gateway → site tab shows unreachable banner, not frozen greens
- [ ] Live incident auto-triages (`groq_live: true`) with zero RUN clicks
- [ ] Kill all 3 → single cure heals all (PIDs change), all NOMINAL ≤20s, site green + Pay works, no refresh
- [ ] Backend flipped to live mode after tab load → live graph appears ≤12s, no refresh; backend killed → static fallback, no frozen frame
- [ ] `Clear all` resets victim faults; `DEMO_SITE_URL` unset → synthetic mode, `pytest tests/` green
- [ ] Troubleshooting: stale squatters on :8001–8004 (old supervisors) → kill listeners by port, never `pkill -f` self-matching patterns
