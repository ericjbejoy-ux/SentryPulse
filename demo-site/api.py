"""api — :8002 core-banking-switch. Transfer logic over dbsim (:8003)."""
import os
import time

import httpx
from fastapi import FastAPI
from pydantic import BaseModel

from common import Metrics, apply_fault_delay, current_fault, do_real_work, fault

app = FastAPI(title="demo-site api (core-banking-switch)")
metrics = Metrics()
DB_URL = os.getenv("DB_URL", "http://127.0.0.1:8003")


class Transfer(BaseModel):
    acct: str = "alice"
    amount: float = 10.0


class Fault(BaseModel):
    type: str  # latency | clear
    latency_ms: float = 0.0
    duration_s: float = 30.0


@app.get("/health")
def health():
    f = current_fault()
    return {
        "status": "degraded" if f else "ok",
        "service": "api",
        "node": "core-banking-switch",
        "fault": f,
    }


@app.get("/metrics")
def get_metrics():
    return metrics.snapshot()


@app.get("/balance")
def balance(acct: str = "alice"):
    t0 = time.time()
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(f"{DB_URL}/balance", params={"acct": acct})
        body = resp.json()
        if "error" in body:
            raise RuntimeError(body["error"])
        metrics.record(time.time() - t0, False)
        return {"ok": True, "acct": acct, "balance": body.get("balance")}
    except Exception as exc:
        metrics.record(time.time() - t0, True)
        return {"ok": False, "error": str(exc)}


@app.get("/transactions")
def transactions():
    try:
        with httpx.Client(timeout=5.0) as client:
            return client.get(f"{DB_URL}/transactions").json()
    except Exception as exc:
        return {"transactions": [], "error": str(exc)}


@app.post("/transfer")
def transfer(req: Transfer):
    t0 = time.time()
    try:
        apply_fault_delay()
        do_real_work(units=max(1, 8))
        with httpx.Client(timeout=5.0) as client:
            resp = client.post(f"{DB_URL}/debit", json=req.model_dump())
        body = resp.json()
        if not body.get("ok", True) or "error" in body:
            raise RuntimeError(body.get("error", "db rejected debit"))
        metrics.record(time.time() - t0, False)
        return {"ok": True, "balance": body.get("balance")}
    except Exception as exc:
        metrics.record(time.time() - t0, True)
        return {"ok": False, "error": str(exc)}


@app.post("/credit")
def credit(req: Transfer):
    t0 = time.time()
    try:
        apply_fault_delay()
        do_real_work(units=max(1, 8))
        with httpx.Client(timeout=5.0) as client:
            resp = client.post(f"{DB_URL}/credit", json=req.model_dump())
        body = resp.json()
        if not body.get("ok", True) or "error" in body:
            raise RuntimeError(body.get("error", "db rejected credit"))
        metrics.record(time.time() - t0, False)
        return {"ok": True, "balance": body.get("balance")}
    except Exception as exc:
        metrics.record(time.time() - t0, True)
        return {"ok": False, "error": str(exc)}


@app.post("/fault")
def set_fault(req: Fault):
    if req.type == "clear":
        fault.clear()
        return {"fault": None}
    fault.inject(req.type, latency_ms=req.latency_ms, duration_s=req.duration_s)
    return {"fault": current_fault()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api:app", host="127.0.0.1", port=8002, log_level="warning")
