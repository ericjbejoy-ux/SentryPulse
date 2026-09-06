from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

state = {
    "isAttacked": False,
    "isResolved": False,
}

@app.get("/api/v1/topology")
def get_topology():
    if state["isResolved"]:
        return {
            "isAttacked": False,
            "isResolved": True,
            "nodes": [
                {"id": "fe", "label": "storefront-ui", "status": "NOMINAL", "cpu": "22%", "latency": "12ms", "load": "0.18", "packets": "1.2k", "position": {"x": 240, "y": 30}},
                {"id": "gw", "label": "api-gateway", "status": "NOMINAL", "cpu": "28%", "latency": "18ms", "load": "0.32", "packets": "3.4k", "position": {"x": 240, "y": 150}},
                {"id": "cart", "label": "cart-service", "status": "NOMINAL", "cpu": "20%", "latency": "14ms", "load": "0.25", "packets": "1.8k", "position": {"x": 60, "y": 270}},
                {"id": "redis", "label": "redis-session-cache", "status": "NOMINAL", "cpu": "12%", "latency": "2ms", "load": "0.08", "packets": "4.1k", "position": {"x": 420, "y": 270}},
                {"id": "db", "label": "postgres-db (READ-REPLICA)", "status": "NOMINAL", "cpu": "30%", "latency": "8ms", "load": "0.45", "packets": "2.1k", "alertMessage": "FAILOVER COMPLETE", "position": {"x": 240, "y": 390}},
            ],
            "edges": [
                {"id": "e1", "source": "fe", "target": "gw", "status": "NOMINAL"},
                {"id": "e2", "source": "gw", "target": "cart", "status": "NOMINAL"},
                {"id": "e3", "source": "gw", "target": "redis", "status": "NOMINAL"},
                {"id": "e4", "source": "cart", "target": "db", "status": "NOMINAL"},
            ]
        }

    if state["isAttacked"]:
        return {
            "isAttacked": True,
            "isResolved": False,
            "nodes": [
                {"id": "fe", "label": "storefront-ui", "status": "WARNING", "cpu": "78%", "latency": "180ms", "load": "3.10", "packets": "12.4k", "position": {"x": 240, "y": 30}},
                {"id": "gw", "label": "api-gateway", "status": "WARNING", "cpu": "85%", "latency": "320ms", "load": "5.40", "packets": "28.1k", "position": {"x": 240, "y": 150}},
                {"id": "cart", "label": "cart-service", "status": "CRITICAL", "cpu": "96%", "latency": "1200ms", "load": "11.2", "packets": "18.5k", "alertMessage": "CONNECTION POOL EXHAUSTED", "position": {"x": 60, "y": 270}},
                {"id": "redis", "label": "redis-session-cache", "status": "NOMINAL", "cpu": "22%", "latency": "4ms", "load": "0.15", "packets": "8.2k", "position": {"x": 420, "y": 270}},
                {"id": "db", "label": "postgres-primary-db", "status": "CRITICAL", "cpu": "99%", "latency": "4500ms", "load": "18.9", "packets": "45.0k", "alertMessage": "ROW-LOCK SATURATION", "position": {"x": 240, "y": 390}},
            ],
            "edges": [
                {"id": "e1", "source": "fe", "target": "gw", "status": "WARNING"},
                {"id": "e2", "source": "gw", "target": "cart", "status": "CRITICAL"},
                {"id": "e3", "source": "gw", "target": "redis", "status": "NOMINAL"},
                {"id": "e4", "source": "cart", "target": "db", "status": "CRITICAL"},
            ]
        }

    return {
        "isAttacked": False,
        "isResolved": False,
        "nodes": [
            {"id": "fe", "label": "storefront-ui", "status": "NOMINAL", "cpu": "15%", "latency": "10ms", "load": "0.15", "packets": "950", "position": {"x": 240, "y": 30}},
            {"id": "gw", "label": "api-gateway", "status": "NOMINAL", "cpu": "22%", "latency": "15ms", "load": "0.28", "packets": "2.2k", "position": {"x": 240, "y": 150}},
            {"id": "cart", "label": "cart-service", "status": "NOMINAL", "cpu": "18%", "latency": "12ms", "load": "0.20", "packets": "1.1k", "position": {"x": 60, "y": 270}},
            {"id": "redis", "label": "redis-session-cache", "status": "NOMINAL", "cpu": "10%", "latency": "1ms", "load": "0.05", "packets": "3.8k", "position": {"x": 420, "y": 270}},
            {"id": "db", "label": "postgres-primary-db", "status": "NOMINAL", "cpu": "25%", "latency": "6ms", "load": "0.38", "packets": "1.5k", "position": {"x": 240, "y": 390}},
        ],
        "edges": [
            {"id": "e1", "source": "fe", "target": "gw", "status": "NOMINAL"},
            {"id": "e2", "source": "gw", "target": "cart", "status": "NOMINAL"},
            {"id": "e3", "source": "gw", "target": "redis", "status": "NOMINAL"},
            {"id": "e4", "source": "cart", "target": "db", "status": "NOMINAL"},
        ]
    }

@app.post("/api/v1/simulate/attack")
def trigger_attack():
    state["isAttacked"] = True
    state["isResolved"] = False
    return {"status": "attack_injected"}

@app.post("/api/v1/simulate/mitigate")
def trigger_mitigate():
    state["isAttacked"] = False
    state["isResolved"] = True
    return {"status": "mitigation_applied"}

@app.post("/api/v1/simulate/reset")
def trigger_reset():
    state["isAttacked"] = False
    state["isResolved"] = False
    return {"status": "reset_complete"}