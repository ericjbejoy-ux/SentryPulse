"""dbsim — :8003 cbs-db-primary. In-memory ledger with a bounded write pool.

Deadlock fault = a holder thread grabs every pool permit for the duration,
so real debits queue up / time out exactly like a threadpool exhaustion.
"""
import threading
import time
from typing import Dict

from fastapi import FastAPI
from pydantic import BaseModel

from common import Metrics, apply_fault_delay, current_fault, do_real_work, fault

app = FastAPI(title="demo-site dbsim (cbs-db-primary)")
metrics = Metrics()
ledger: Dict[str, float] = {"alice": 10000.0, "bob": 5000.0}
ledger_lock = threading.Lock()

WRITE_POOL_SIZE = 8
write_pool = threading.Semaphore(WRITE_POOL_SIZE)


class Debit(BaseModel):
    acct: str = "alice"
    amount: float = 10.0


class Fault(BaseModel):
    type: str  # latency | deadlock | clear
    latency_ms: float = 0.0
    duration_s: float = 30.0


@app.get("/health")
def health():
    f = current_fault()
    return {
        "status": "degraded" if f else "ok",
        "service": "dbsim",
        "node": "cbs-db-primary",
        "fault": f,
    }


@app.get("/metrics")
def get_metrics():
    return metrics.snapshot()


@app.get("/balance")
def balance(acct: str = "alice"):
    t0 = time.time()
    try:
        apply_fault_delay()
        do_real_work()
        with ledger_lock:
            value = ledger.get(acct, 0.0)
        metrics.record(time.time() - t0, False)
        return {"acct": acct, "balance": value}
    except Exception as exc:
        metrics.record(time.time() - t0, True)
        return {"error": str(exc)}


@app.post("/debit")
def debit(req: Debit):
    t0 = time.time()
    # Deadlock fault: seize the whole pool so this debit cannot proceed.
    if fault.snapshot()["deadlock"]:
        metrics.record(time.time() - t0, True)
        return {"error": "write pool exhausted (deadlock)", "ok": False}
    acquired = write_pool.acquire(timeout=2.0)
    if not acquired:
        metrics.record(time.time() - t0, True)
        return {"error": "write pool timeout", "ok": False}
    try:
        apply_fault_delay()
        do_real_work()
        with ledger_lock:
            ledger[req.acct] = ledger.get(req.acct, 0.0) - req.amount
            value = ledger[req.acct]
        metrics.record(time.time() - t0, False)
        return {"ok": True, "acct": req.acct, "balance": value}
    except Exception as exc:
        metrics.record(time.time() - t0, True)
        return {"error": str(exc), "ok": False}
    finally:
        write_pool.release()


@app.post("/fault")
def set_fault(req: Fault):
    if req.type == "clear":
        fault.clear()
        return {"fault": None}
    # Seize pool permits in the background for the deadlock duration.
    if req.type == "deadlock":
        fault.inject("deadlock", duration_s=req.duration_s)

        def _holder():
            permits = []
            for _ in range(WRITE_POOL_SIZE):
                if write_pool.acquire(timeout=0.5):
                    permits.append(1)
            time.sleep(req.duration_s)
            for _ in permits:
                write_pool.release()

        threading.Thread(target=_holder, daemon=True).start()
    else:
        fault.inject(req.type, latency_ms=req.latency_ms, duration_s=req.duration_s)
    return {"fault": current_fault()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("dbsim:app", host="127.0.0.1", port=8003, log_level="warning")
