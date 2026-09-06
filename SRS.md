# System Requirements Specification (SRS) for SentryPulse

## 1. Introduction

### 1.1 Purpose
This document defines the software requirements for **SentryPulse**: an autonomous AI incident war room and adaptive network digital twin designed for real-time infrastructure resilience, automated triage, and multi-objective remediation.

### 1.2 Scope
SentryPulse ingests live network telemetry, logs, and commit histories to isolate breaking failures. It simulates potential mitigations inside a virtual Digital Twin using a parallel AI agent swarm and executes low-risk failovers based on multi-objective trade-off optimizations (Risk, Disruption, Latency, and Cost).

---

## 2. Team Member Roles & Responsibilities

| Role | Primary Module Ownership | Responsibilities |
| :--- | :--- | :--- |
| **Backend Lead** | `backend/core/`, `backend/main.py` | FastAPI application architecture, WebSocket manager, event routing, API endpoints. |
| **Jr. Backend** | `backend/telemetry/`, `backend/models/` | Live telemetry generation, NetworkX graph state engine, database/in-memory state management. |
| **AI/ML Lead** | `backend/ai/agents/`, `backend/ai/optimizer.py` | Parallel Multi-Agent Swarm orchestration (Log, Git, Patch agents via Groq) and Multi-Objective Pareto Optimization engine. |
| **Jr. AI/ML** | `backend/ai/prompts/`, `backend/ai/predictor.py` | Prompt engineering, log parsing pipelines, attack probability prediction scoring, audio synthesis payload generation. |
| **Frontend Lead** | `frontend/src/` | 60 FPS Spatial Topology Canvas (React Flow), real-time WebSocket client integration, control panels, interactive war room UI. |

---

## 3. System Architecture & Cross-Platform Specifications

### 3.1 Repository Directory Layout
```text
SentryPulse/
├── .github/              # CI/CD Workflows
├── backend/              # Python FastAPI Core
│   ├── ai/               # AI/ML Lead & Jr. AI/ML Workspace
│   │   ├── agents/       # Parallel Log, Git, and Patch Swarm
│   │   ├── predictor.py  # Attack Probability Engine
│   │   └── optimizer.py  # Multi-Objective Pareto Optimizer
│   ├── core/             # Backend Lead Workspace
│   │   ├── config.py     # Environment & Settings
│   │   └── websocket.py  # Real-time Telemetry Broadcast Manager
│   ├── telemetry/        # Jr. Backend Workspace
│   │   └── twin.py       # NetworkX Digital Twin State Engine
│   ├── main.py           # Application Entrypoint
│   └── requirements.txt  # Python Dependencies
├── frontend/             # React + Vite Frontend
│   ├── src/
│   │   ├── canvas/       # React Flow Topology Visualizer
│   │   └── components/   # War Room Control Panels & Logs
│   └── package.json
├── .gitattributes        # Forces LF line endings across OS platforms
├── README.md
└── SRS.md