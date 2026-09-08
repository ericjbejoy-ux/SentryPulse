"""gateway — :8001 idfc-api-gateway. Ingress: serves the SentryBank site
(/), routes /pay + /account to api (:8002), aggregates /status lights."""
import os
import time
from pathlib import Path

import httpx
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from common import Metrics, apply_fault_delay, current_fault, do_real_work, fault

app = FastAPI(title="demo-site gateway (idfc-api-gateway)")
metrics = Metrics()
API_URL = os.getenv("API_URL", "http://127.0.0.1:8002")
DB_URL = os.getenv("DB_URL", "http://127.0.0.1:8003")
SITE_HTML = Path(__file__).parent / "site.html"


class Pay(BaseModel):
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
        "service": "gateway",
        "node": "idfc-api-gateway",
        "fault": f,
    }


@app.get("/", include_in_schema=False)
def site():
    if SITE_HTML.exists():
        return FileResponse(str(SITE_HTML), media_type="text/html")
    return JSONResponse({"service": "gateway", "site": "site.html missing"})


@app.get("/metrics")
def get_metrics():
    return metrics.snapshot()


@app.get("/status")
def status():
    """Aggregated lights + latency tails for the site tab."""
    services = [
        {"svc": "gateway", "port": 8001, "base": "http://127.0.0.1:8001"},
        {"svc": "api", "port": 8002, "base": API_URL},
        {"svc": "db", "port": 8003, "base": DB_URL},
    ]
    out = []
    with httpx.Client(timeout=2.0) as client:
        for s in services:
            try:
                body = client.get(f"{s['base']}/health").json()
                state = "ok" if body.get("status") == "ok" else "degraded"
            except Exception:
                state = "down"
                out.append({"svc": s["svc"], "port": s["port"], "status": state, "lat_tail": []})
                continue
            try:
                tail = client.get(f"{s['base']}/metrics").json().get("lat_tail", [])
            except Exception:
                tail = []
            out.append({"svc": s["svc"], "port": s["port"], "status": state, "lat_tail": tail})
    return {"services": out}


@app.get("/account")
def account(acct: str = "alice"):
    t0 = time.time()
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(f"{API_URL}/balance", params={"acct": acct})
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
            return client.get(f"{API_URL}/transactions").json()
    except Exception as exc:
        return {"transactions": [], "error": str(exc)}


@app.post("/demo/reset")
def demo_reset():
    """Reseed the ledger (demo Reset button). Faults untouched."""
    try:
        with httpx.Client(timeout=5.0) as client:
            return client.post(f"{DB_URL}/ledger/reset").json()
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


@app.post("/topup")
def topup(req: Pay):
    """Credit an account through the full chain (Top-up button)."""
    t0 = time.time()
    try:
        apply_fault_delay()
        do_real_work(units=4)
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(f"{API_URL}/credit", json=req.model_dump())
        body = resp.json()
        if not body.get("ok", False):
            raise RuntimeError(body.get("error", "top-up failed"))
        metrics.record(time.time() - t0, False)
        return {"ok": True, "balance": body.get("balance")}
    except Exception as exc:
        metrics.record(time.time() - t0, True)
        return {"ok": False, "error": str(exc)}


@app.post("/pay")
def pay(req: Pay):
    t0 = time.time()
    try:
        apply_fault_delay()
        do_real_work(units=4)
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(f"{API_URL}/transfer", json=req.model_dump())
        body = resp.json()
        if not body.get("ok", False):
            raise RuntimeError(body.get("error", "transfer failed"))
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

    uvicorn.run("gateway:app", host="127.0.0.1", port=8001, log_level="warning")
