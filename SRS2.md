## Project Title: SentryPulse — Autonomous Resilience & Generative Architecture Auditor
**Document Version:** 1.0.0  
**Target Environment:** Microservice Infrastructure & Financial Technology Systems  
**Architecture Model:** Digital Twin, AIOps, Multi-Agent Swarm & Autonomous Remediation  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) details the functional, non-functional, and architectural requirements for **SentryPulse**. SentryPulse is an enterprise-grade Digital Twin platform designed to mirror complex microservice topologies, execute stochastic failure simulations, analyze system logs via multi-agent AI, compute Pareto-optimal fixes, and trigger automated self-healing workflows without manual SRE intervention.

### 1.2 Scope
SentryPulse interfaces directly with standardized telemetry sources (OpenTelemetry, Prometheus, RCAEval benchmark datasets) to build an in-memory topological model of a target application (e.g., Core Banking Switches, API Gateways, Payment Infrastructure). The system detects anomalies using machine learning (Isolation Forest), evaluates trade-offs between mitigation strategies, and dispatches webhooks to automation orchestrators (such as n8n, Kubernetes API, or AWS Lambda) to resolve infrastructure failures in real time.

### 1.3 Definitions & Acronyms
* **Digital Twin:** A real-time virtual representation of a physical or cloud software ecosystem mirroring its topology, state, and dependencies.
* **OpenTelemetry (OTel):** A vendor-neutral observability framework for generating, collecting, and exporting telemetry data (metrics, logs, traces).
* **Monte Carlo Simulation:** A computational algorithm that relies on repeated random sampling to model probability distributions of complex systems under stress.
* **Pareto Frontier:** A decision-making framework where no single metric (e.g., cost) can be improved without degrading another metric (e.g., speed or SLA risk).
* **MTTR:** Mean Time To Recovery.
* **SSE:** Server-Sent Events for streaming real-time backend data over HTTP.

---

## 2. System Architecture & Topology Overview

The target application topology modeled by the Digital Twin consists of four core node tiers:
1. `idfc-api-gateway`: Ingress traffic routing and rate-limiting tier.
2. `core-banking-switch`: Transaction routing and protocol conversion engine.
3. `cbs-db-primary`: Primary PostgreSQL/Oracle database handling transactional write locks.
4. `upi-settlement-cache`: High-throughput Redis/In-Memory cache for payment settlements.

---

## 3. Functional Requirements (FR)

### FR-1: Digital Twin State Engine & Telemetry Ingestion
* **FR-1.1:** The backend shall ingest multi-variable time-series metrics (`P99 latency`, `CPU utilization`, `RPS throughput`, `error_rate`) at sub-second polling intervals.
* **FR-1.2:** The platform shall parse OpenTelemetry-compliant metrics schemas and map metric vectors directly to active topology nodes.
* **FR-1.3:** The backend shall maintain a real-time state space object representing node health states: `NOMINAL` (Green), `DEGRADED` (Yellow), and `CRITICAL` (Red).

### FR-2: Interactive Topology Canvas & Sub-Topology Inspector
* **FR-2.1:** The frontend shall render a Directed Acyclic Graph (DAG) visualizing microservice nodes and directional dependency arrows.
* **FR-2.2:** When a user clicks on any topology node, a **Sub-Topology Inspection Drawer** shall slide open to display granular sub-tier metrics (e.g., Primary Write Pools, Read Replicas, Worker Threadpool capacity).
* **FR-2.3:** The sub-topology view shall display dynamic Root Cause Analysis (RCA) diagnostic descriptions associated with the selected node.

### FR-3: Stochastic Monte Carlo Simulation Engine
* **FR-3.1:** The system shall feature a `🚀 RUN 100K STOCHASTIC SIMULATION` trigger that executes up to 100,000 parallel test permutations across the digital twin model within <3 seconds.
* **FR-3.2:** The simulation engine shall inject stochastic chaos vectors including randomized latency spikes, database threadpool deadlocks, schema drift, and payload saturation.
* **FR-3.3:** The engine shall calculate a dynamic `Resilience Score (%)` and `Vector Drift` index post-simulation.

### FR-4: Machine Learning Anomaly Detection
* **FR-4.1:** The backend shall run an `Isolation Forest` model (or dynamic Z-score thresholding engine) on ingested metric vectors to compute real-time anomaly scores ($0.00$ to $1.00$).
* **FR-4.2:** An anomaly score exceeding $0.65$ shall automatically trip system state from `NOMINAL` to `CRITICAL`, triggering visual alarm states on affected UI nodes.

### FR-5: Multi-Agent AI Swarm Triage
* **FR-5.1:** **LogAgent:** Ingests raw stack traces and identifies threshold breaches (e.g., P99 > 300ms).
* **FR-5.2:** **PredictorAgent:** Computes cascading failure probabilities across downstream topology dependencies (e.g., DB threadlock cascading to UPI Switch).
* **FR-5.3:** **PatchAgent:** Synthesizes actionable, multi-option remediation plans.

### FR-6: Pareto Frontier Decision Engine
* **FR-6.1:** The platform shall evaluate candidate remediation options using a multi-objective trade-off space across three parameters:
  * **MTTR Speed (Seconds)**
  * **Financial Cost ($/hr)**
  * **SLA Risk Score (0.0 to 1.0)**
* **FR-6.2:** The UI shall render an interactive Pareto Scatter Plot curve highlighting the mathematically optimal strategy (e.g., Option A: Threadpool Isolation) versus sub-optimal strategies (e.g., Option B: Region Failover).

### FR-7: Autonomous Self-Healing & Webhook Integration
* **FR-7.1:** Clicking `⚡ EXECUTE ONE-CLICK AUTO-PATCH` shall dispatch an outbound HTTP POST payload to an external automation orchestrator (`n8n` / Kubernetes Webhook).
* **FR-7.2:** The webhook payload shall contain target node IDs, action types, and strategy parameters.
* **FR-7.3:** Upon receiving an HTTP `200 OK` confirmation, the system shall reset affected node latency and CPU states back to `NOMINAL` within 1.5 seconds.

### FR-8: Real-Time Synchronization Terminal Drawer
* **FR-8.1:** The bottom panel of the user interface shall feature a live terminal streaming backend event logs via Server-Sent Events (SSE) or WebSockets.
* **FR-8.2:** The terminal shall display precise timestamps, API endpoint calls, anomaly calculation outputs, and HTTP payload exchanges to verify live backend processing.

---

## 4. Non-Functional Requirements (NFR)

### NFR-1: Performance & Latency
* **NFR-1.1:** Frontend polling latency for metric state updates shall not exceed **1.5 seconds**.
* **NFR-1.2:** The 100k stochastic simulation execution feedback loop shall complete in under **3.0 seconds**.
* **NFR-1.3:** Self-healing webhook dispatch and UI state recovery shall execute within **2.0 seconds**.

### NFR-2: Scalability & Modularity
* **NFR-2.1:** The topology rendering engine shall dynamically accept dynamic node configurations from JSON/YAML environment descriptors without code modification.
* **NFR-2.2:** Backend services shall be completely decoupled across four isolated branches (`telemetry-engine`, `ai-swarm-engine`, `frontend-twin`, `n8n-automation`).

### NFR-3: User Interface & Experience
* **NFR-3.1:** The visual interface shall adhere to a modern dark command-center aesthetic (`#06080c` background) using high-contrast color coding (Emerald Green for nominal, Crimson Red for critical alerts, Cyan for decision matrices).
* **NFR-3.2:** The layout shall fit within a single-screen 1080p dashboard view without requiring vertical viewport scrolling during high-stakes pitch presentations.

### NFR-4: Fault Tolerance & Graceful Degradation
* **NFR-4.1:** If the local backend telemetry server goes offline, the frontend shall gracefully fall back to local simulated telemetry streams without crashing the UI graph.

---

## 5. Interface & API Schema Specifications

### 5.1 Telemetry Endpoint
`GET /api/v1/telemetry/live`
```json
{
  "timestamp": "11:45:02.102Z",
  "latency_ms": 480,
  "cpu": "88%",
  "rps": 24800,
  "error_rate": 0.042,
  "is_attacked": true,
  "failing_node": "cbs-db-primary"
}
5.2 Simulation EndpointPOST /api/v1/simulation/startJSON// Payload
{ "permutations": 100000, "chaos_type": "THREADPOOL_LOCK" }

// Response
{
  "status": "COMPLETED",
  "permutations_executed": 100000,
  "resilience_score": 62.4,
  "vector_drift": "CRITICAL_ANOMALY_DETECTED"
}
5.3 Webhook Healing EndpointPOST /api/v1/n8n/triggerJSON// Payload
{
  "strategy": "ISOLATE_DB_THREADPOOL_WORKER_04",
  "target": "cbs-db-primary",
  "timestamp": 1714921800
}

// Response
{
  "status": "SUCCESS",
  "execution_id": "n8n-exec-9921",
  "mttr_seconds": 1.2
}
6. Verification & Acceptance CriteriaVisual Contrast: Toggling from baseline state to stress mode visually flips topology nodes from glowing emerald green to pulsing crimson red.Interactive Drill-Down: Clicking cbs-db-primary successfully opens the Sub-Topology drawer displaying write pool exhaustion metrics.Pareto Evaluation: Clicking candidate strategy cards updates the Pareto Frontier chart selection point and calculates risk scores.Closed-Loop Resolution: Executing the auto-patch command fires the webhook log in the real-time terminal and restores all topology nodes back to green state.
---

## 🔄 End-to-End System Workflow

┌────────────────────────────────────────────────────────────────────────────────────────┐│ 1. INGESTION & TWIN SYNCHRONIZATION                                                   ││    Physical Infrastructure / RCAEval Datasets ──(OTel Metrics)──► FastAPI Backend      │└──────────────────────────────────────────┬─────────────────────────────────────────────┘│▼┌────────────────────────────────────────────────────────────────────────────────────────┐│ 2. STOCHASTIC TESTING & ANOMALY DETECTION                                              ││    Monte Carlo Engine (100k Permutations) ──► Isolation Forest ML / Dynamic Thresholds │└──────────────────────────────────────────┬─────────────────────────────────────────────┘│▼┌────────────────────────────────────────────────────────────────────────────────────────┐│ 3. MULTI-AGENT SWARM REASONING                                                        ││    LogAgent (Log Parse) ──► PredictorAgent (Cascading Risk) ──► PatchAgent (Options)   │└──────────────────────────────────────────┬─────────────────────────────────────────────┘│▼┌────────────────────────────────────────────────────────────────────────────────────────┐│ 4. PARETO OPTIMIZATION & DECISION                                                      ││    NSGA-II Trade-Off Matrix: Option A (Threadpool Shift) vs Option B (Failover)        │└──────────────────────────────────────────┬─────────────────────────────────────────────┘│▼┌────────────────────────────────────────────────────────────────────────────────────────┐│ 5. AUTONOMOUS SELF-HEALING                                                            ││    User / Automated Trigger ──► n8n Outbound Webhook ──► Infrastructure State Reset   │└────────────────────────────────────────────────────────────────────────────────────────┘
---

## 👥 4-Member Work Distribution Plan

To prevent merge conflicts during development, the codebase is partitioned into four distinct Git feature branches with strictly defined API interface contracts:

                     ┌─────────────────────────┐
                     │   MAIN BRANCH (MAIN)    │
                     └────────────▲────────────┘
                                  │ Integration
  ┌──────────────────┬────────────┴────────────┬──────────────────┐
  │                  │                         │                  │
┌─────────────┐    ┌─────────────┐           ┌─────────────┐    ┌─────────────┐│  FEATURE/   │    │  FEATURE/   │           │  FEATURE/   │    │  FEATURE/   ││ TELEMETRY   │    │  AI-SWARM   │           │  FRONTEND   │    │  N8N-HEAL   ││ (Person 1)  │    │ (Person 2)  │           │ (Person 3)  │    │ (Person 4)  │└─────────────┘    └─────────────┘           └─────────────┘    └─────────────┘
| Member | Feature Branch | Core Responsibilities | Expected Deliverables / APIs |
| :--- | :--- | :--- | :--- |
| **Person 1** | `feature/telemetry-engine` | FastAPI telemetry loop, Monte Carlo simulation worker, Isolation Forest ML anomaly scoring engine. | `GET /api/v1/telemetry/live`<br>`POST /api/v1/simulation/start`<br>`SSE /api/v1/telemetry/stream` |
| **Person 2** | `feature/ai-swarm-engine` | Implement multi-agent swarm (`LogAgent`, `PredictorAgent`, `PatchAgent`) and NSGA-II Pareto trade-off optimization matrix. | `POST /api/v1/triage`<br>`GET /api/v1/pareto/options` |
| **Person 3** | `feature/frontend-twin` | Build React command center, topology canvas, sub-topology inspection drawer, Pareto charts, and terminal logs. | Complete responsive UI layout in `src/App.tsx` |
| **Person 4** | `feature/n8n-automation` | Build n8n workflows, receive strategy payloads, execute infrastructure mitigation resets, and maintain fallback mocks. | `POST /api/v1/n8n/trigger` |

---

## 📖 Main Repository `README.md`

```markdown
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

[ OpenTelemetry / Datasets ] ──► [ FastAPI Backend ] ──► [ Isolation Forest ML ]│▼[ n8n Healing Webhooks ] ◄── [ Multi-Agent Swarm ] ──► [ React Command Center UI ]
---

## 🚀 Quickstart Guide

### 1. Backend Setup (FastAPI)

```bash
# Clone repository
git clone [https://github.com/your-org/sentrypulse.git](https://github.com/your-org/sentrypulse.git)
cd sentrypulse/backend

# Install dependencies
pip install fastapi uvicorn scikit-learn pandas

# Run backend engine
uvicorn main:app --reload --port 8000
2. Frontend Setup (React + Tailwind CSS)Bashcd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
👥 Branch Distribution & ReadmesEach sub-component of SentryPulse is maintained in its dedicated branch:feature/telemetry-engine — README_TELEMETRY.md (FastAPI, OTel Ingestion, Monte Carlo)feature/ai-swarm-engine — README_SWARM.md (Multi-Agent Feed, Pareto Decision Logic)feature/frontend-twin — README_FRONTEND.md (React UI, Topology Graph, Pareto Chart)feature/n8n-automation — README_N8N.md (n8n Webhook Listener & Mitigation Scripts)📡 API Contract OverviewEndpointMethodDescription/api/v1/telemetry/liveGETPolls live system metric vector (latency, CPU, RPS)/api/v1/simulation/startPOSTTriggers 100k parallel Monte Carlo failure permutation test/api/v1/triagePOSTIngests metric anomalies and returns Multi-Agent diagnostic logs/api/v1/n8n/triggerPOSTFires outbound self-healing patch to n8n orchestration engine📄 LicenseDistributed under the MIT License. See LICENSE for more information.
<ElicitationsGroup message="Where should we focus next for implementation?">
  <Elicitation label="Generate backend code for Person 1 (Telemetry & Monte Carlo)" query="Provide the FastAPI backend code for Person 1 including the telemetry polling loop, Monte Carlo simulation worker, and Isolation Forest ML scoring."/>
  <Elicitation label="Generate React dashboard code for Person 3 (Frontend Twin)" query="Provide the complete React code for Person 3 including the digital twin graph, sub-topology inspection drawer, and live terminal drawer."/>
  <Elicitation label="Generate Multi-Agent code for Person 2 (Swarm & Pareto)" query="Provide the Python multi-agent swarm implementation (LogAgent, PredictorAgent, PatchAgent) and Pareto optimization decision matrix."/>
</ElicitationsGroup>
