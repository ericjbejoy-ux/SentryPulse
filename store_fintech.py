from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SentryPulse - Enterprise Fintech Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

state = {
    "is_attacked": False,
    "is_resolved": False,
    "active_fault": "kafka_backpressure"
}

class AttackRequest(BaseModel):
    fault_type: str = "kafka_backpressure"

@app.get("/api/v1/topology")
def get_topology():
    # 1. MITIGATED / RESOLVED STATE
    if state["is_resolved"]:
        return {
            "storeName": "Global Payments & Settlement Network",
            "isAttacked": False,
            "isResolved": True,
            "activeFault": state["active_fault"],
            "nodes": [
                {"id": "1", "label": "mobile-checkout-us-east", "status": "NOMINAL", "cpu": "18%", "latency": "12ms", "load": "0.15", "packets": "28.4k", "position": {"x": 80, "y": 20}},
                {"id": "2", "label": "pos-terminal-eu-central", "status": "NOMINAL", "cpu": "16%", "latency": "18ms", "load": "0.14", "packets": "19.2k", "position": {"x": 400, "y": 20}},
                {"id": "3", "label": "edge-api-gateway", "status": "NOMINAL", "cpu": "22%", "latency": "10ms", "load": "0.28", "packets": "58.1k", "position": {"x": 240, "y": 100}},
                {"id": "4", "label": "auth-token-vault", "status": "NOMINAL", "cpu": "20%", "latency": "4ms", "load": "0.21", "packets": "34.0k", "position": {"x": 80, "y": 190}},
                {"id": "5", "label": "fraud-ml-inference", "status": "NOMINAL", "cpu": "32%", "latency": "22ms", "load": "0.41", "packets": "18.5k", "position": {"x": 400, "y": 190}},
                {"id": "6", "label": "kafka-transaction-bus", "status": "NOMINAL", "cpu": "24%", "latency": "6ms", "load": "0.30", "packets": "140.0k", "position": {"x": 240, "y": 280}},
                {"id": "7", "label": "settlement-worker-cluster", "status": "NOMINAL", "cpu": "28%", "latency": "14ms", "load": "0.35", "packets": "42.0k", "position": {"x": 80, "y": 370}},
                {"id": "8", "label": "cockroach-global-ledger", "status": "NOMINAL", "cpu": "34%", "latency": "12ms", "load": "0.48", "packets": "62.4k", "alertMessage": "REPLICATION BALANCED", "position": {"x": 400, "y": 370}},
            ],
            "edges": [
                {"id": "e1", "source": "1", "target": "3", "status": "NOMINAL"},
                {"id": "e2", "source": "2", "target": "3", "status": "NOMINAL"},
                {"id": "e3", "source": "3", "target": "4", "status": "NOMINAL"},
                {"id": "e4", "source": "3", "target": "5", "status": "NOMINAL"},
                {"id": "e5", "source": "4", "target": "6", "status": "NOMINAL"},
                {"id": "e6", "source": "5", "target": "6", "status": "NOMINAL"},
                {"id": "e7", "source": "6", "target": "7", "status": "NOMINAL"},
                {"id": "e8", "source": "7", "target": "8", "status": "NOMINAL"},
            ]
        }

    # 2. NOMINAL HEALTHY STATE
    if not state["is_attacked"]:
        return {
            "storeName": "Global Payments & Settlement Network",
            "isAttacked": False,
            "isResolved": False,
            "activeFault": state["active_fault"],
            "nodes": [
                {"id": "1", "label": "mobile-checkout-us-east", "status": "NOMINAL", "cpu": "15%", "latency": "10ms", "load": "0.12", "packets": "24.1k", "position": {"x": 80, "y": 20}},
                {"id": "2", "label": "pos-terminal-eu-central", "status": "NOMINAL", "cpu": "14%", "latency": "15ms", "load": "0.11", "packets": "16.8k", "position": {"x": 400, "y": 20}},
                {"id": "3", "label": "edge-api-gateway", "status": "NOMINAL", "cpu": "19%", "latency": "8ms", "load": "0.22", "packets": "48.2k", "position": {"x": 240, "y": 100}},
                {"id": "4", "label": "auth-token-vault", "status": "NOMINAL", "cpu": "18%", "latency": "3ms", "load": "0.18", "packets": "29.4k", "position": {"x": 80, "y": 190}},
                {"id": "5", "label": "fraud-ml-inference", "status": "NOMINAL", "cpu": "28%", "latency": "18ms", "load": "0.32", "packets": "15.1k", "position": {"x": 400, "y": 190}},
                {"id": "6", "label": "kafka-transaction-bus", "status": "NOMINAL", "cpu": "21%", "latency": "5ms", "load": "0.25", "packets": "120.0k", "position": {"x": 240, "y": 280}},
                {"id": "7", "label": "settlement-worker-cluster", "status": "NOMINAL", "cpu": "22%", "latency": "12ms", "load": "0.28", "packets": "36.2k", "position": {"x": 80, "y": 370}},
                {"id": "8", "label": "cockroach-global-ledger", "status": "NOMINAL", "cpu": "30%", "latency": "10ms", "load": "0.40", "packets": "54.1k", "position": {"x": 400, "y": 370}},
            ],
            "edges": [
                {"id": "e1", "source": "1", "target": "3", "status": "NOMINAL"},
                {"id": "e2", "source": "2", "target": "3", "status": "NOMINAL"},
                {"id": "e3", "source": "3", "target": "4", "status": "NOMINAL"},
                {"id": "e4", "source": "3", "target": "5", "status": "NOMINAL"},
                {"id": "e5", "source": "4", "target": "6", "status": "NOMINAL"},
                {"id": "e6", "source": "5", "target": "6", "status": "NOMINAL"},
                {"id": "e7", "source": "6", "target": "7", "status": "NOMINAL"},
                {"id": "e8", "source": "7", "target": "8", "status": "NOMINAL"},
            ]
        }

    # 3. ATTACKED / FAULT INJECTED STATES
    fault = state["active_fault"]

    if fault == "distributed_lock":
        nodes = [
            {"id": "1", "label": "mobile-checkout-us-east", "status": "WARNING", "cpu": "68%", "latency": "950ms", "load": "3.80", "packets": "38.1k", "position": {"x": 80, "y": 20}},
            {"id": "2", "label": "pos-terminal-eu-central", "status": "WARNING", "cpu": "72%", "latency": "1200ms", "load": "4.10", "packets": "28.2k", "position": {"x": 400, "y": 20}},
            {"id": "3", "label": "edge-api-gateway", "status": "WARNING", "cpu": "85%", "latency": "1800ms", "load": "7.80", "packets": "92.0k", "position": {"x": 240, "y": 100}},
            {"id": "4", "label": "auth-token-vault", "status": "NOMINAL", "cpu": "22%", "latency": "4ms", "load": "0.20", "packets": "31.2k", "position": {"x": 80, "y": 190}},
            {"id": "5", "label": "fraud-ml-inference", "status": "NOMINAL", "cpu": "30%", "latency": "20ms", "load": "0.35", "packets": "16.0k", "position": {"x": 400, "y": 190}},
            {"id": "6", "label": "kafka-transaction-bus", "status": "WARNING", "cpu": "78%", "latency": "850ms", "load": "6.20", "packets": "180.0k", "position": {"x": 240, "y": 280}},
            {"id": "7", "label": "settlement-worker-cluster", "status": "CRITICAL", "cpu": "98%", "latency": "12400ms", "load": "24.1", "packets": "4.2k", "alertMessage": "2PC TIMEOUT EXHAUSTION", "position": {"x": 80, "y": 370}},
            {"id": "8", "label": "cockroach-global-ledger", "status": "CRITICAL", "cpu": "100%", "latency": "18200ms", "load": "42.8", "packets": "2.1k", "alertMessage": "SERIALIZABLE ISOLATION DEADLOCK", "position": {"x": 400, "y": 370}},
        ]
        edges = [
            {"id": "e1", "source": "1", "target": "3", "status": "WARNING"},
            {"id": "e2", "source": "2", "target": "3", "status": "WARNING"},
            {"id": "e3", "source": "3", "target": "4", "status": "NOMINAL"},
            {"id": "e4", "source": "3", "target": "5", "status": "NOMINAL"},
            {"id": "e5", "source": "4", "target": "6", "status": "NOMINAL"},
            {"id": "e6", "source": "5", "target": "6", "status": "NOMINAL"},
            {"id": "e7", "source": "6", "target": "7", "status": "CRITICAL", "animated": True},
            {"id": "e8", "source": "7", "target": "8", "status": "CRITICAL", "animated": True},
        ]
    else:  # Default Kafka Consumer Lag & Model Deadlock
        nodes = [
            {"id": "1", "label": "mobile-checkout-us-east", "status": "WARNING", "cpu": "62%", "latency": "640ms", "load": "2.90", "packets": "32.1k", "position": {"x": 80, "y": 20}},
            {"id": "2", "label": "pos-terminal-eu-central", "status": "WARNING", "cpu": "58%", "latency": "580ms", "load": "2.60", "packets": "22.4k", "position": {"x": 400, "y": 20}},
            {"id": "3", "label": "edge-api-gateway", "status": "WARNING", "cpu": "79%", "latency": "1100ms", "load": "5.40", "packets": "78.0k", "position": {"x": 240, "y": 100}},
            {"id": "4", "label": "auth-token-vault", "status": "NOMINAL", "cpu": "25%", "latency": "5ms", "load": "0.24", "packets": "35.0k", "position": {"x": 80, "y": 190}},
            {"id": "5", "label": "fraud-ml-inference", "status": "CRITICAL", "cpu": "99%", "latency": "6800ms", "load": "18.2", "packets": "1.2k", "alertMessage": "TENSORFLOW INFERENCE DEADLOCK", "position": {"x": 400, "y": 190}},
            {"id": "6", "label": "kafka-transaction-bus", "status": "CRITICAL", "cpu": "96%", "latency": "5200ms", "load": "22.8", "packets": "210.0k", "alertMessage": "CONSUMER LAG > 120,000 MSGS", "position": {"x": 240, "y": 280}},
            {"id": "7", "label": "settlement-worker-cluster", "status": "WARNING", "cpu": "74%", "latency": "820ms", "load": "4.20", "packets": "12.0k", "position": {"x": 80, "y": 370}},
            {"id": "8", "label": "cockroach-global-ledger", "status": "NOMINAL", "cpu": "32%", "latency": "14ms", "load": "0.45", "packets": "28.0k", "position": {"x": 400, "y": 370}},
        ]
        edges = [
            {"id": "e1", "source": "1", "target": "3", "status": "WARNING"},
            {"id": "e2", "source": "2", "target": "3", "status": "WARNING"},
            {"id": "e3", "source": "3", "target": "4", "status": "NOMINAL"},
            {"id": "e4", "source": "3", "target": "5", "status": "CRITICAL", "animated": True},
            {"id": "e5", "source": "4", "target": "6", "status": "NOMINAL"},
            {"id": "e6", "source": "5", "target": "6", "status": "CRITICAL", "animated": True},
            {"id": "e7", "source": "6", "target": "7", "status": "CRITICAL", "animated": True},
            {"id": "e8", "source": "7", "target": "8", "status": "NOMINAL"},
        ]

    return {
        "storeName": "Global Payments & Settlement Network",
        "isAttacked": True,
        "isResolved": False,
        "activeFault": state["active_fault"],
        "nodes": nodes,
        "edges": edges
    }

@app.post("/api/v1/simulate/attack")
def trigger_attack(req: AttackRequest):
    state["is_attacked"] = True
    state["is_resolved"] = False
    state["active_fault"] = req.fault_type
    return {"status": "attack_injected", "fault": req.fault_type}

@app.post("/api/v1/simulate/mitigate")
def apply_mitigation():
    state["is_attacked"] = False
    state["is_resolved"] = True
    return {"status": "mitigation_applied"}

@app.post("/api/v1/simulate/reset")
def reset_simulation():
    state["is_attacked"] = False
    state["is_resolved"] = False
    state["active_fault"] = "kafka_backpressure"
    return {"status": "reset_successful"}