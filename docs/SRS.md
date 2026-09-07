# System Requirements Specification (SRS) for SentryPulse

## 1. Introduction

### 1.1 Purpose
This document defines the comprehensive software requirements for **SentryPulse**: an autonomous AI incident war room and adaptive network digital twin built for real-time infrastructure resilience, automated failure triage, and multi-objective remediation during critical system outages.

### 1.2 Scope
SentryPulse ingests real-time network metrics, system logs, and recent code commit histories to pinpoint breaking failures. Using a multi-agent parallel swarm powered by LLM inference (Groq), it simulates candidate mitigations inside an in-memory Digital Twin and auto-executes optimized failovers based on multi-objective trade-offs (Risk, Disruption, Latency, and Cost).

---

## 2. Team Roles, Task Distribution & File Ownership

| Role | Primary Directory Ownership | Core Responsibilities & Key Deliverables |
| :--- | :--- | :--- |
| **Backend Lead** | `backend/core/`, `backend/main.py` | FastAPI lifecycle engine, WebSocket connection manager, REST endpoints, CORS policies, event bus routing. |
| **Jr. Backend** | `backend/models/`, `backend/telemetry/` | Pydantic data models (`node.py`, `incident.py`, `telemetry.py`), NetworkX Digital Twin graph engine (`twin.py`), log parser (`log_parser.py`). |
| **AI/ML Lead** | `backend/ai/agents/`, `backend/ai/optimizer.py` | Multi-Agent orchestration swarm (Log Agent, Git Inspector, Patch Simulator via Groq), Multi-Objective Pareto optimization trade-off engine. |
| **Jr. AI/ML** | `backend/ai/prompts/`, `backend/ai/predictor.py` | System prompt templates, structured JSON output parsers, attack probability scoring algorithm, voice debrief payload generation. |
| **Frontend Lead** | `src/` | Spatial Topology Canvas (`components/TopologyCanvas.jsx`), unified-backend API client (`lib/api.js`), war room panels (`components/`). |

---

## 3. Complete Project Directory Structure

```text
SentryPulse/
├── backend/                      # Unified single-backend MVP (port 8000)
│   ├── ai/                       # AI Workspaces (AI/ML Lead & Jr. AI/ML)
│   │   ├── agents/               # FR-5.1 LogAgent (Groq-live root-cause analysis)
│   │   ├── prompts/              # Jr. AI: System prompt templates (triage_prompts.py)
│   │   ├── swarm.py              # Multi-agent orchestrator (rules + Groq-live)
│   │   ├── optimizer.py          # AI Lead: Multi-Objective Pareto Optimizer (FR-6)
│   │   └── predictor.py          # Jr. AI: Attack Probability Scoring Engine (FR-5.2)
│   ├── core/                     # Backend Lead Workspace
│   │   ├── config.py             # App settings, environment variables, Groq client
│   │   └── websocket.py          # WebSocket Manager & Broadcast Event Bus
│   ├── ml/                       # FR-4: Isolation Forest scorer + offline eval
│   │   ├── anomaly.py            # AnomalyScorer singleton
│   │   └── eval_anomaly_accuracy.py
│   ├── models/                   # Jr. Backend Workspace (Pydantic Schemas)
│   │   ├── node.py               # Infrastructure Topology Node Data Models
│   │   ├── incident.py           # Incident Event & Triage State Schemas
│   │   ├── telemetry.py          # Real-time Network Metric Payload Schemas
│   │   └── twin_schemas.py       # Canonical twin/sim API contract (SRS §5)
│   ├── routers/                  # FR-7: n8n self-healing webhook (healing.py)
│   ├── telemetry/                # Jr. Backend Workspace
│   │   ├── state.py              # DigitalTwinState engine (FR-1)
│   │   ├── simulation.py         # Vectorized Monte Carlo engine (FR-3)
│   │   ├── twin.py               # NetworkX graph (legacy WS path)
│   │   └── log_parser.py         # Ingestion Pipeline for System Logs
│   └── main.py                   # FastAPI Application Entrypoint
├── src/                          # Frontend Lead Workspace (Vite + React)
│   ├── components/               # War room panels (canvas, Pareto, terminal, drawer)
│   └── lib/api.js                # Unified-backend API client + SSE subscription
├── chaos/                        # Optional live-failure injector (ports 8001-8003)
├── n8n/                          # Self-healing workflow (import into n8n)
├── docs/                         # SRS.md, SRS2.md, telemetry.md
├── tests/                        # Backend contract tests (pytest)
├── requirements.txt              # Shared Python dependencies (pip install -r)
├── package.json                  # Frontend dependencies (npm ci)
├── Dockerfile / docker-compose.yml
├── .gitignore                    # OS, env, and build exclusion rules
└── README.md                     # Project overview + MVP quickstart
```
