# AURA: AI-Driven Adaptive Network Digital-Twin

> **Real-time infrastructure resilience engine combining dynamic predictive attack simulation with multi-objective configuration optimization.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20Flow%20%7C%20Groq%20%7C%20WebSockets-blue)](#tech-stack)

---

## 🎯 Executive Summary

Enterprise downtime costs over **$5,600 per minute**. Traditional Incident Response tools suffer from two critical flaws:
1. **Reactive Triage:** They alert engineers *after* damage occurs.
2. **Brute-Force Remediation:** Standard fixes (e.g., completely blocking an IP or node) reduce attack risk but cause massive, collateral service disruption for legitimate users.

**AURA** solves this by establishing a continuous **Live Network Digital Twin**. Instead of just detecting incidents, AURA predicts threat vectors, simulates attack progression in a virtual replica, and uses **multi-objective optimization** to apply patches that minimize risk *without* sacrificing performance or availability.

---

## 🔬 Core Innovation: Trade-off Optimization Engine

AURA does not simply choose the safest configuration—it evaluates the **Pareto frontier** across four critical operational vectors:

$$\text{Optimal Config} = \arg\min_{\mathcal{C}} \Big( \alpha \cdot \text{Risk}(\mathcal{C}) + \beta \cdot \text{Disruption}(\mathcal{C}) + \gamma \cdot \text{Latency}(\mathcal{C}) + \delta \cdot \text{Cost}(\mathcal{C}) \Big)$$

---

## 🚀 MVP Quickstart (single unified backend + Vite frontend)

Prereqs: Python 3.11+, Node 20+, a `GROQ_API_KEY` (backend runs rule-based fallback without one).

```bash
# 1. Clone & enter
git clone <your-fork-url> && cd SentryPulse
git checkout mvp

# 2. Backend (port 8000)
cp .env.example .env        # then set GROQ_API_KEY inside .env
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000
# docs -> http://localhost:8000/docs

# 3. Frontend (port 5173) — new terminal
npm ci
npm run dev                 # open http://localhost:5173
```

The header pill shows `● BACKEND LIVE + GROQ` when wired, `○ LOCAL SIM MODE` when offline (UI keeps working on local simulation).

### Key endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | liveness + Groq flag |
| GET | `/api/v1/telemetry/live` | flat SRS §5.1 snapshot |
| GET | `/api/v1/telemetry/stream` | SSE live stream |
| POST | `/api/v1/simulation/start` | 100k Monte Carlo (SRS §5.2) |
| POST | `/api/v1/triage` | Groq-live swarm triage + Pareto |
| GET | `/api/v1/pareto/options` | MTTR / cost / SLA-risk matrix |
| POST | `/api/v1/n8n/trigger` | one-click auto-patch webhook |

### Docker (alternative)

```bash
cp .env.example .env   # set GROQ_API_KEY
docker compose up --build
# api -> :8000, frontend -> :5173, n8n -> :5678
```

### Verify

```bash
python -m pytest tests/ -q
npm run build
```
