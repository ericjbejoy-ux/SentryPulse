from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SentryPulse Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global simulation state
state = {
    "is_attacked": False,
    "is_resolved": False,
    "active_fault": "db_lock"
}

class AttackRequest(BaseModel):
    fault_type: str = "db_lock"

@app.get("/api/v1/topology")
def get_topology():
    if state["is_resolved"]:
        return {
            "isAttacked": False,
            "isResolved": True,
            "activeFault": state["active_fault"],
            "nodes": [
                {"id": "1", "label": "storefront-ui", "status": "NOMINAL", "cpu": "18%", "latency": "12ms", "load": "0.18", "packets": "1.2k", "position": {"x": 240, "y": 30}},
                {"id": "2", "label": "api-gateway", "status": "NOMINAL", "cpu": "24%", "latency": "18ms", "load": "0.32", "packets": "3.4k", "position": {"x": 240, "y": 150}},
                {"id": "3", "label": "cart-service", "status": "NOMINAL", "cpu": "22%", "latency": "14ms", "load": "0.25", "packets": "1.8k", "position": {"x": 60, "y": 270}},
                {"id": "4", "label": "redis-cache", "status": "NOMINAL", "cpu": "12%", "latency": "2ms", "load": "0.08", "packets": "4.1k", "position": {"x": 420, "y": 270}},
                {"id": "5", "label": "postgres-db (SEC)", "status": "NOMINAL", "cpu": "28%", "latency": "8ms", "load": "0.45", "packets": "2.1k", "alertMessage": "FAILOVER COMPLETE", "position": {"x": 240, "y": 390}},
            ],
            "edges": [
                {"id": "e1", "source": "1", "target": "2", "status": "NOMINAL"},
                {"id": "e2", "source": "2", "target": "3", "status": "NOMINAL"},
                {"id": "e3", "source": "2", "target": "4", "status": "NOMINAL"},
                {"id": "e4", "source": "3", "target": "5", "status": "NOMINAL"},
            ]
        }

    if not state["is_attacked"]:
        return {
            "isAttacked": False,
            "isResolved": False,
            "activeFault": state["active_fault"],
            "nodes": [
                {"id": "1", "label": "storefront-ui", "status": "NOMINAL", "cpu": "15%", "latency": "10ms", "load": "0.15", "packets": "950", "position": {"x": 240, "y": 30}},
                {"id": "2", "label": "api-gateway", "status": "NOMINAL", "cpu": "22%", "latency": "15ms", "load": "0.28", "packets": "2.2k", "position": {"x": 240, "y": 150}},
                {"id": "3", "label": "cart-service", "status": "NOMINAL", "cpu": "18%", "latency": "12ms", "load": "0.20", "packets": "1.1k", "position": {"x": 60, "y": 270}},
                {"id": "4", "label": "redis-cache", "status": "NOMINAL", "cpu": "10%", "latency": "1ms", "load": "0.05", "packets": "3.8k", "position": {"x": 420, "y": 270}},
                {"id": "5", "label": "postgres-primary-db", "status": "NOMINAL", "cpu": "25%", "latency": "6ms", "load": "0.38", "packets": "1.5k", "position": {"x": 240, "y": 390}},
            ],
            "edges": [
                {"id": "e1", "source": "1", "target": "2", "status": "NOMINAL"},
                {"id": "e2", "source": "2", "target": "3", "status": "NOMINAL"},
                {"id": "e3", "source": "2", "target": "4", "status": "NOMINAL"},
                {"id": "e4", "source": "3", "target": "5", "status": "NOMINAL"},
            ]
        }

    # Attack active payloads
    fault = state["active_fault"]

    if fault == "memory_leak":
        nodes = [
            {"id": "1", "label": "storefront-ui", "status": "WARNING", "cpu": "45%", "latency": "210ms", "load": "1.80", "packets": "4.2k", "position": {"x": 240, "y": 30}},
            {"id": "2", "label": "api-gateway", "status": "WARNING", "cpu": "62%", "latency": "480ms", "load": "2.90", "packets": "8.1k", "position": {"x": 240, "y": 150}},
            {"id": "3", "label": "cart-service", "status": "CRITICAL", "cpu": "100%", "latency": "ERR_503", "load": "ERR", "packets": "0", "alertMessage": "OOM KILLED (MEM > 99%)", "position": {"x": 60, "y": 270}},
            {"id": "4", "label": "redis-cache", "status": "NOMINAL", "cpu": "14%", "latency": "2ms", "load": "0.09", "packets": "3.5k", "position": {"x": 420, "y": 270}},
            {"id": "5", "label": "postgres-primary-db", "status": "NOMINAL", "cpu": "18%", "latency": "5ms", "load": "0.22", "packets": "420", "position": {"x": 240, "y": 390}},
        ]
        edges = [
            {"id": "e1", "source": "1", "target": "2", "status": "WARNING"},
            {"id": "e2", "source": "2", "target": "3", "status": "CRITICAL", "animated": True},
            {"id": "e3", "source": "2", "target": "4", "status": "NOMINAL"},
            {"id": "e4", "source": "3", "target": "5", "status": "NOMINAL"},
        ]
    elif fault == "cache_stampede":
        nodes = [
            {"id": "1", "label": "storefront-ui", "status": "WARNING", "cpu": "68%", "latency": "140ms", "load": "2.40", "packets": "8.8k", "position": {"x": 240, "y": 30}},
            {"id": "2", "label": "api-gateway", "status": "WARNING", "cpu": "74%", "latency": "290ms", "load": "4.10", "packets": "16.2k", "position": {"x": 240, "y": 150}},
            {"id": "3", "label": "cart-service", "status": "WARNING", "cpu": "82%", "latency": "380ms", "load": "3.80", "packets": "14.1k", "position": {"x": 60, "y": 270}},
            {"id": "4", "label": "redis-cache", "status": "CRITICAL", "cpu": "100%", "latency": "990ms", "load": "15.2", "packets": "89.0k", "alertMessage": "CACHE MISS STORM", "position": {"x": 420, "y": 270}},
            {"id": "5", "label": "postgres-primary-db", "status": "CRITICAL", "cpu": "92%", "latency": "1800ms", "load": "11.4", "packets": "38.0k", "alertMessage": "UNCACHED READ SURGE", "position": {"x": 240, "y": 390}},
        ]
        edges = [
            {"id": "e1", "source": "1", "target": "2", "status": "WARNING"},
            {"id": "e2", "source": "2", "target": "3", "status": "WARNING"},
            {"id": "e3", "source": "2", "target": "4", "status": "CRITICAL", "animated": True},
            {"id": "e4", "source": "3", "target": "5", "status": "CRITICAL", "animated": True},
        ]
    elif fault == "ddos":
        nodes = [
            {"id": "1", "label": "storefront-ui", "status": "CRITICAL", "cpu": "98%", "latency": "3200ms", "load": "24.0", "packets": "180.0k", "alertMessage": "SYN FLOOD DETECTED", "position": {"x": 240, "y": 30}},
            {"id": "2", "label": "api-gateway", "status": "CRITICAL", "cpu": "99%", "latency": "4100ms", "load": "31.5", "packets": "210.0k", "alertMessage": "BANDWIDTH SATURATION", "position": {"x": 240, "y": 150}},
            {"id": "3", "label": "cart-service", "status": "WARNING", "cpu": "65%", "latency": "180ms", "load": "2.10", "packets": "5.4k", "position": {"x": 60, "y": 270}},
            {"id": "4", "label": "redis-cache", "status": "NOMINAL", "cpu": "18%", "latency": "3ms", "load": "0.12", "packets": "4.2k", "position": {"x": 420, "y": 270}},
            {"id": "5", "label": "postgres-primary-db", "status": "NOMINAL", "cpu": "22%", "latency": "7ms", "load": "0.30", "packets": "1.2k", "position": {"x": 240, "y": 390}},
        ]
        edges = [
            {"id": "e1", "source": "1", "target": "2", "status": "CRITICAL", "animated": True},
            {"id": "e2", "source": "2", "target": "3", "status": "WARNING"},
            {"id": "e3", "source": "2", "target": "4", "status": "NOMINAL"},
            {"id": "e4", "source": "3", "target": "5", "status": "NOMINAL"},
        ]
    elif fault == "fintech_payment":
        nodes = [
            {"id": "1", "label": "checkout-portal", "status": "WARNING", "cpu": "64%", "latency": "850ms", "load": "3.12", "packets": "18.4k", "position": {"x": 240, "y": 30}},
            {"id": "2", "label": "payment-api-gw", "status": "WARNING", "cpu": "82%", "latency": "1420ms", "load": "6.80", "packets": "42.1k", "position": {"x": 240, "y": 150}},
            {"id": "3", "label": "kafka-event-bus", "status": "CRITICAL", "cpu": "94%", "latency": "4800ms", "load": "22.1", "packets": "120.0k", "alertMessage": "CONSUMER GROUP LAG > 50K", "position": {"x": 60, "y": 270}},
            {"id": "4", "label": "fraud-eval-worker", "status": "CRITICAL", "cpu": "99%", "latency": "3100ms", "load": "14.2", "packets": "8.5k", "alertMessage": "MODEL INFERENCE DEADLOCK", "position": {"x": 420, "y": 270}},
            {"id": "5", "label": "cockroach-ledger-db", "status": "WARNING", "cpu": "78%", "latency": "620ms", "load": "4.10", "packets": "15.2k", "position": {"x": 240, "y": 390}},
        ]
        edges = [
            {"id": "e1", "source": "1", "target": "2", "status": "WARNING"},
            {"id": "e2", "source": "2", "target": "3", "status": "CRITICAL", "animated": True},
            {"id": "e3", "source": "2", "target": "4", "status": "CRITICAL", "animated": True},
            {"id": "e4", "source": "3", "target": "5", "status": "WARNING"},
        ]
    elif fault == "llm_cluster":
        nodes = [
            {"id": "1", "label": "copilot-web-ui", "status": "WARNING", "cpu": "58%", "latency": "2200ms", "load": "2.40", "packets": "6.2k", "position": {"x": 240, "y": 30}},
            {"id": "2", "label": "langchain-orchestrator", "status": "CRITICAL", "cpu": "95%", "latency": "8900ms", "load": "18.4", "packets": "24.1k", "alertMessage": "CONTEXT BUFFER OVERFLOW", "position": {"x": 240, "y": 150}},
            {"id": "3", "label": "qdrant-vector-index", "status": "CRITICAL", "cpu": "91%", "latency": "3400ms", "load": "12.1", "packets": "18.9k", "alertMessage": "HNSW GRAPH MEMORY SWAP", "position": {"x": 60, "y": 270}},
            {"id": "4", "label": "vllm-gpu-node-a100", "status": "CRITICAL", "cpu": "100%", "latency": "12400ms", "load": "45.0", "packets": "2.1k", "alertMessage": "CUDA OUT OF MEMORY", "position": {"x": 420, "y": 270}},
            {"id": "5", "label": "model-weights-s3", "status": "NOMINAL", "cpu": "12%", "latency": "15ms", "load": "0.10", "packets": "520", "position": {"x": 240, "y": 390}},
        ]
        edges = [
            {"id": "e1", "source": "1", "target": "2", "status": "WARNING"},
            {"id": "e2", "source": "2", "target": "3", "status": "CRITICAL", "animated": True},
            {"id": "e3", "source": "2", "target": "4", "status": "CRITICAL", "animated": True},
            {"id": "e4", "source": "4", "target": "5", "status": "NOMINAL"},
        ]
    else:  # Default DB Lock
        nodes = [
            {"id": "1", "label": "storefront-ui", "status": "WARNING", "cpu": "78%", "latency": "180ms", "load": "3.10", "packets": "12.4k", "position": {"x": 240, "y": 30}},
            {"id": "2", "label": "api-gateway", "status": "WARNING", "cpu": "85%", "latency": "320ms", "load": "5.40", "packets": "28.1k", "position": {"x": 240, "y": 150}},
            {"id": "3", "label": "cart-service", "status": "CRITICAL", "cpu": "96%", "latency": "1200ms", "load": "11.2", "packets": "18.5k", "alertMessage": "POOL EXHAUSTED", "position": {"x": 60, "y": 270}},
            {"id": "4", "label": "redis-cache", "status": "NOMINAL", "cpu": "22%", "latency": "4ms", "load": "0.15", "packets": "8.2k", "position": {"x": 420, "y": 270}},
            {"id": "5", "label": "postgres-primary-db", "status": "CRITICAL", "cpu": "99%", "latency": "4500ms", "load": "18.9", "packets": "45.0k", "alertMessage": "ROW-LOCK SATURATION", "position": {"x": 240, "y": 390}},
        ]
        edges = [
            {"id": "e1", "source": "1", "target": "2", "status": "WARNING"},
            {"id": "e2", "source": "2", "target": "3", "status": "CRITICAL", "animated": True},
            {"id": "e3", "source": "2", "target": "4", "status": "NOMINAL"},
            {"id": "e4", "source": "3", "target": "5", "status": "CRITICAL", "animated": True},
        ]

    return {
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
    state["active_fault"] = "db_lock"
    return {"status": "reset_successful"}