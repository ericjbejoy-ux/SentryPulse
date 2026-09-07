# SentryPulse — Autonomous Resilience & Generative Architecture Auditor

> **An Enterprise-Grade Digital Twin platform that continuously monitors microservice topology, runs stochastic Monte Carlo load simulations, performs multi-agent AI root cause analysis, and executes self-healing workflows.**

---

## 🌟 Key Features

- **🌐 Digital Twin Topology Canvas:** Real-time state mapping of complex microservices (API Gateway, Core Banking, UPI Switch) with sub-topology drill-down diagnostics.
- **🚀 100k Parallel Monte Carlo Engine:** Simulates 100,000 failure permutations in seconds to surface hidden dependency bottlenecks before they hit production.
- **🤖 Multi-Agent AI Swarm:** Triages telemetry logs, predicts cascading failure paths, and formulates trade-off patches (`LogAgent`, `PredictorAgent`, `PatchAgent`).
- **🎯 Pareto Frontier Decision Engine:** Evaluates candidate fixes across MTTR, financial cost, and SLA risk metrics using NSGA-II trade-off models.
- **⚡ Autonomous Self-Healing:** Dispatches outbound `n8n` orchestration webhooks to isolate faulty threadpools and restore system health without human intervention.
- **💻 Real-Time SSE Terminal Drawer:** Streams live backend execution logs, HTTP statuses, and anomaly scores to prove real-time non-hardcoded operation.

---

## 🏗️ System Architecture

```
[ OpenTelemetry / Datasets ] ──► [ FastAPI Backend ] ──► [ Isolation Forest ML ]
                                          │
                                          ▼
[ n8n Healing Webhooks ] ◄── [ Multi-Agent Swarm ] ──► [ React Command Center UI ]
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup (FastAPI)

```bash
# Clone repository
git clone https://github.com/your-org/sentrypulse.git
cd sentrypulse/backend

# Install dependencies
pip install fastapi uvicorn scikit-learn pandas

# Run backend engine
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup (React + Tailwind CSS)

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 👥 Branch Distribution & Readmes

Each sub-component of SentryPulse is maintained in its dedicated branch:

- `feature/telemetry-engine` — `README_TELEMETRY.md` (FastAPI, OTel Ingestion, Monte Carlo)
- `feature/ai-swarm-engine` — `README_SWARM.md` (Multi-Agent Feed, Pareto Decision Logic)
- `feature/frontend-twin` — `README_FRONTEND.md` (React UI, Topology Graph, Pareto Chart)
- `feature/n8n-automation` — `README_N8N.md` (n8n Webhook Listener & Mitigation Scripts)

## 📡 API Contract Overview

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/telemetry/live` | GET | Polls live system metric vector (latency, CPU, RPS) |
| `/api/v1/simulation/start` | POST | Triggers 100k parallel Monte Carlo failure permutation test |
| `/api/v1/triage` | POST | Ingests metric anomalies and returns Multi-Agent diagnostic logs |
| `/api/v1/n8n/trigger` | POST | Fires outbound self-healing patch to n8n orchestration engine |

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.