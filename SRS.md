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
| **Frontend Lead** | `frontend/src/` | 60 FPS Spatial Topology Canvas using React Flow (`canvas/`), WebSocket telemetry hooks (`hooks/`), interactive war room control dashboard (`components/`). |

---

## 3. Complete Project Directory Structure

```text
SentryPulse/
├── .github/
│   └── workflows/                # Shared CI/CD automated deployment pipelines
├── backend/
│   ├── ai/                       # AI Workspaces (AI/ML Lead & Jr. AI/ML)
│   │   ├── agents/               # AI Lead: Parallel Log, Git, Patch Swarm engine
│   │   ├── optimizer.py          # AI Lead: Multi-Objective Pareto Optimizer
│   │   ├── predictor.py          # Jr. AI: Attack Probability Scoring Engine
│   │   └── prompts/              # Jr. AI: System prompt templates & JSON schemas
│   ├── core/                     # Backend Lead Workspace
│   │   ├── config.py             # App settings, environment variables, Groq client
│   │   └── websocket.py          # WebSocket Manager & Broadcast Event Bus
│   ├── models/                   # Jr. Backend Workspace (Pydantic / DB Schemas)
│   │   ├── node.py               # Infrastructure Topology Node Data Models
│   │   ├── incident.py           # Incident Event & Triage State Schemas
│   │   └── telemetry.py          # Real-time Network Metric Payload Schemas
│   ├── telemetry/                # Jr. Backend Workspace
│   │   ├── twin.py               # NetworkX Digital Twin Graph State Engine
│   │   └── log_parser.py         # Ingestion Pipeline for System Logs
│   ├── main.py                   # Backend Lead: FastAPI Application Entrypoint
│   └── requirements.txt          # Shared Cross-Platform Python Dependencies
├── frontend/                     # Frontend Lead Workspace
│   ├── src/
│   │   ├── canvas/               # React Flow Spatial Topology Node Map
│   │   ├── components/           # War Room Control Panel, Audio, & Log Feeds
│   │   ├── hooks/                # WebSocket & Telemetry Stream React Hooks
│   │   └── types/                # TypeScript Interfaces matching backend models
│   └── package.json
├── .gitattributes                # Enforces Unix LF line endings across Windows/Linux
├── .gitignore                    # OS and environment exclusion rules
├── README.md                     # Project overview and hackathon pitch deck summary
└── SRS.md                        # System Requirements Specification