from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SentryPulse - TeleHealth Infrastructure")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
)

state = {
    "is_attacked": False,
    "is_resolved": False,
    "active_fault": "ehr_vault_lock"
}

class AttackRequest(BaseModel):
    fault_type: str = "ehr_vault_lock"

@app.get("/api/v1/topology")
def get_topology():
    # 1. MITIGATED / RESOLVED STATE
    if state["is_resolved"]:
        return {
            "storeName": "Apex Health Systems - Patient Telemetry Twin",
            "isAttacked": False,
            "isResolved": True,
            "activeFault": state["active_fault"],
            "nodes": [
                {"id": "1", "label": "icu-bedside-monitors", "status": "NOMINAL", "cpu": "12%", "latency": "4ms", "load": "0.08", "packets": "180.0k", "position": {"x": 80, "y": 20}},
                {"id": "2", "label": "patient-mobile-portal", "status": "NOMINAL", "cpu": "14%", "latency": "10ms", "load": "0.12", "packets": "12.4k", "position": {"x": 400, "y": 20}},
                {"id": "3", "label": "hipaa-zero-trust-gw", "status": "NOMINAL", "cpu": "18%", "latency": "12ms", "load": "0.22", "packets": "45.0k", "position": {"x": 240, "y": 100}},
                {"id": "4", "label": "emqtt-vitals-broker", "status": "NOMINAL", "cpu": "22%", "latency": "3ms", "load": "0.28", "packets": "210.0k", "position": {"x": 80, "y": 190}},
                {"id": "5", "label": "realtime-cardiac-analytics", "status": "NOMINAL", "cpu": "26%", "latency": "15ms", "load": "0.34", "packets": "85.0k", "position": {"x": 400, "y": 190}},
                {"id": "6", "label": "fhir-interop-bridge", "status": "NOMINAL", "cpu": "20%", "latency": "18ms", "load": "0.25", "packets": "24.0k", "position": {"x": 240, "y": 280}},
                {"id": "7", "label": "ehr-encrypted-vault", "status": "NOMINAL", "cpu": "28%", "latency": "11ms", "load": "0.42", "packets": "8.4k", "alertMessage": "KMS RATE-LIMIT CLEAR", "position": {"x": 240, "y": 370}},
            ],
            "edges": [
                {"id": "e1", "source": "1", "target": "4", "status": "NOMINAL"},
                {"id": "e2", "source": "2", "target": "3", "status": "NOMINAL"},
                {"id": "e3", "source": "3", "target": "4", "status": "NOMINAL"},
                {"id": "e4", "source": "3", "target": "5", "status": "NOMINAL"},
                {"id": "e5", "source": "4", "target": "6", "status": "NOMINAL"},
                {"id": "e6", "source": "5", "target": "6", "status": "NOMINAL"},
                {"id": "e7", "source": "6", "target": "7", "status": "NOMINAL"},
            ]
        }

    # 2. NOMINAL HEALTHY STATE
    if not state["is_attacked"]:
        return {
            "storeName": "Apex Health Systems - Patient Telemetry Twin",
            "isAttacked": False,
            "isResolved": False,
            "activeFault": state["active_fault"],
            "nodes": [
                {"id": "1", "label": "icu-bedside-monitors", "status": "NOMINAL", "cpu": "10%", "latency": "3ms", "load": "0.06", "packets": "165.0k", "position": {"x": 80, "y": 20}},
                {"id": "2", "label": "patient-mobile-portal", "status": "NOMINAL", "cpu": "12%", "latency": "8ms", "load": "0.10", "packets": "10.2k", "position": {"x": 400, "y": 20}},
                {"id": "3", "label": "hipaa-zero-trust-gw", "status": "NOMINAL", "cpu": "15%", "latency": "10ms", "load": "0.18", "packets": "38.0k", "position": {"x": 240, "y": 100}},
                {"id": "4", "label": "emqtt-vitals-broker", "status": "NOMINAL", "cpu": "18%", "latency": "2ms", "load": "0.20", "packets": "190.0k", "position": {"x": 80, "y": 190}},
                {"id": "5", "label": "realtime-cardiac-analytics", "status": "NOMINAL", "cpu": "22%", "latency": "12ms", "load": "0.28", "packets": "78.0k", "position": {"x": 400, "y": 190}},
                {"id": "6", "label": "fhir-interop-bridge", "status": "NOMINAL", "cpu": "16%", "latency": "14ms", "load": "0.20", "packets": "21.0k", "position": {"x": 240, "y": 280}},
                {"id": "7", "label": "ehr-encrypted-vault", "status": "NOMINAL", "cpu": "24%", "latency": "9ms", "load": "0.35", "packets": "7.2k", "position": {"x": 240, "y": 370}},
            ],
            "edges": [
                {"id": "e1", "source": "1", "target": "4", "status": "NOMINAL"},
                {"id": "e2", "source": "2", "target": "3", "status": "NOMINAL"},
                {"id": "e3", "source": "3", "target": "4", "status": "NOMINAL"},
                {"id": "e4", "source": "3", "target": "5", "status": "NOMINAL"},
                {"id": "e5", "source": "4", "target": "6", "status": "NOMINAL"},
                {"id": "e6", "source": "5", "target": "6", "status": "NOMINAL"},
                {"id": "e7", "source": "6", "target": "7", "status": "NOMINAL"},
            ]
        }

    # 3. ATTACKED / FAULT INJECTED STATES
    fault = state["active_fault"]

    if fault == "mqtt_ingestion_overflow":
        nodes = [
            {"id": "1", "label": "icu-bedside-monitors", "status": "WARNING", "cpu": "45%", "latency": "180ms", "load": "1.80", "packets": "320.0k", "position": {"x": 80, "y": 20}},
            {"id": "2", "label": "patient-mobile-portal", "status": "NOMINAL", "cpu": "14%", "latency": "10ms", "load": "0.12", "packets": "11.0k", "position": {"x": 400, "y": 20}},
            {"id": "3", "label": "hipaa-zero-trust-gw", "status": "WARNING", "cpu": "68%", "latency": "420ms", "load": "3.20", "packets": "88.0k", "position": {"x": 240, "y": 100}},
            {"id": "4", "label": "emqtt-vitals-broker", "status": "CRITICAL", "cpu": "100%", "latency": "8400ms", "load": "28.5", "packets": "450.0k", "alertMessage": "BUFFER OVERFLOW (MQTT QUEUE EXHAUSTED)", "position": {"x": 80, "y": 190}},
            {"id": "5", "label": "realtime-cardiac-analytics", "status": "CRITICAL", "cpu": "98%", "latency": "6200ms", "load": "18.1", "packets": "12.0k", "alertMessage": "STREAM PROCESSOR DROPPING FRAMES", "position": {"x": 400, "y": 190}},
            {"id": "6", "label": "fhir-interop-bridge", "status": "WARNING", "cpu": "72%", "latency": "890ms", "load": "4.80", "packets": "8.0k", "position": {"x": 240, "y": 280}},
            {"id": "7", "label": "ehr-encrypted-vault", "status": "NOMINAL", "cpu": "25%", "latency": "10ms", "load": "0.32", "packets": "6.8k", "position": {"x": 240, "y": 370}},
        ]
        edges = [
            {"id": "e1", "source": "1", "target": "4", "status": "CRITICAL", "animated": True},
            {"id": "e2", "source": "2", "target": "3", "status": "NOMINAL"},
            {"id": "e3", "source": "3", "target": "4", "status": "WARNING"},
            {"id": "e4", "source": "3", "target": "5", "status": "CRITICAL", "animated": True},
            {"id": "e5", "source": "4", "target": "6", "status": "CRITICAL", "animated": True},
            {"id": "e6", "source": "5", "target": "6", "status": "CRITICAL", "animated": True},
            {"id": "e7", "source": "6", "target": "7", "status": "NOMINAL"},
        ]
    else:  # Default HIPAA Encryption KMS Lock
        nodes = [
            {"id": "1", "label": "icu-bedside-monitors", "status": "NOMINAL", "cpu": "12%", "latency": "4ms", "load": "0.08", "packets": "170.0k", "position": {"x": 80, "y": 20}},
            {"id": "2", "label": "patient-mobile-portal", "status": "WARNING", "cpu": "58%", "latency": "620ms", "load": "2.40", "packets": "18.2k", "position": {"x": 400, "y": 20}},
            {"id": "3", "label": "hipaa-zero-trust-gw", "status": "WARNING", "cpu": "82%", "latency": "1400ms", "load": "6.20", "packets": "52.0k", "position": {"x": 240, "y": 100}},
            {"id": "4", "label": "emqtt-vitals-broker", "status": "NOMINAL", "cpu": "20%", "latency": "3ms", "load": "0.22", "packets": "195.0k", "position": {"x": 80, "y": 190}},
            {"id": "5", "label": "realtime-cardiac-analytics", "status": "NOMINAL", "cpu": "24%", "latency": "14ms", "load": "0.30", "packets": "80.0k", "position": {"x": 400, "y": 190}},
            {"id": "6", "label": "fhir-interop-bridge", "status": "CRITICAL", "cpu": "94%", "latency": "4800ms", "load": "14.2", "packets": "3.1k", "alertMessage": "KMS RATE-LIMIT BLOCK", "position": {"x": 240, "y": 280}},
            {"id": "7", "label": "ehr-encrypted-vault", "status": "CRITICAL", "cpu": "100%", "latency": "14200ms", "load": "38.6", "packets": "850", "alertMessage": "ENCRYPTION KEY EXHAUSTION", "position": {"x": 240, "y": 370}},
        ]
        edges = [
            {"id": "e1", "source": "1", "target": "4", "status": "NOMINAL"},
            {"id": "e2", "source": "2", "target": "3", "status": "WARNING"},
            {"id": "e3", "source": "3", "target": "4", "status": "NOMINAL"},
            {"id": "e4", "source": "3", "target": "5", "status": "NOMINAL"},
            {"id": "e5", "source": "4", "target": "6", "status": "CRITICAL", "animated": True},
            {"id": "e6", "source": "5", "target": "6", "status": "CRITICAL", "animated": True},
            {"id": "e7", "source": "6", "target": "7", "status": "CRITICAL", "animated": True},
        ]

    return {
        "storeName": "Apex Health Systems - Patient Telemetry Twin",
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
    state["active_fault"] = "ehr_vault_lock"
    return {"status": "reset_successful"}