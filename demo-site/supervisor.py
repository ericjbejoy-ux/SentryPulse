"""supervisor — :8004. Owns the 3 victim processes; restarts on demand.

SentryPulse's heal hook calls POST /restart/{svc} after a successful
triage. Restarts are rate-limited (1 per service per 10s) so a flapping
victim can never fork-bomb. The supervisor never auto-restarts on its
own — a kill stays dead until something explicitly restarts it.

Usage:  python supervisor.py   (spawns gateway/api/dbsim as children)
"""
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict

import psutil
from fastapi import FastAPI, HTTPException

HERE = Path(__file__).parent
SERVICES = {
    "gateway": {"port": 8001, "module": "gateway:app"},
    "api": {"port": 8002, "module": "api:app"},
    "dbsim": {"port": 8003, "module": "dbsim:app"},
}
RESTART_COOLDOWN_S = 10.0

app = FastAPI(title="demo-site supervisor")
procs: Dict[str, subprocess.Popen] = {}
starts: Dict[str, float] = {}
restarts: Dict[str, int] = {svc: 0 for svc in SERVICES}
last_restart: Dict[str, float] = {svc: 0.0 for svc in SERVICES}


def spawn(svc: str) -> subprocess.Popen:
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", SERVICES[svc]["module"],
         "--host", "127.0.0.1", "--port", str(SERVICES[svc]["port"]),
         "--log-level", "warning"],
        cwd=str(HERE),
    )
    procs[svc] = proc
    starts[svc] = time.time()
    return proc


def pid_on_port(port: int):
    for conn in psutil.net_connections(kind="inet"):
        if getattr(conn.laddr, "port", None) == port and conn.status == "LISTEN" and conn.pid:
            return conn.pid
    return None


@app.get("/status")
def status():
    out = {}
    for svc, info in SERVICES.items():
        proc = procs.get(svc)
        out[svc] = {
            "port": info["port"],
            "pid": pid_on_port(info["port"]),
            "supervised_pid": proc.pid if proc and proc.poll() is None else None,
            "uptime_s": round(time.time() - starts.get(svc, time.time()), 1),
            "restarts": restarts[svc],
        }
    return out


@app.post("/restart/{svc}")
def restart(svc: str):
    if svc not in SERVICES:
        raise HTTPException(status_code=404, detail=f"unknown service {svc}")
    now = time.time()
    if now - last_restart[svc] < RESTART_COOLDOWN_S:
        raise HTTPException(status_code=429, detail="restart cooldown active")
    old = procs.get(svc)
    if old and old.poll() is None:
        old.terminate()
        try:
            old.wait(timeout=5)
        except subprocess.TimeoutExpired:
            old.kill()
    last_restart[svc] = now
    restarts[svc] += 1
    proc = spawn(svc)
    return {"service": svc, "pid": proc.pid, "restarts": restarts[svc]}


@app.post("/kill/{svc}")
def kill(svc: str):
    """SIGKILL the victim (single kill path for CLI + UI). Supervised
    children stay dead until an explicit /restart — no watchdog."""
    if svc not in SERVICES:
        raise HTTPException(status_code=404, detail=f"unknown service {svc}")
    port = SERVICES[svc]["port"]
    pid = pid_on_port(port)
    if not pid:
        raise HTTPException(status_code=404, detail=f"nothing listening on :{port}")
    try:
        psutil.Process(pid).kill()
    except psutil.NoSuchProcess:
        raise HTTPException(status_code=404, detail="process already gone")
    return {"service": svc, "pid": pid, "killed": True}


if __name__ == "__main__":
    import uvicorn

    for svc in SERVICES:
        # Don't double-spawn if something already answers on the port.
        if pid_on_port(SERVICES[svc]["port"]) is None:
            spawn(svc)
            print(f"[supervisor] started {svc} on :{SERVICES[svc]['port']}")
        else:
            print(f"[supervisor] :{SERVICES[svc]['port']} already in use, {svc} not spawned")
    uvicorn.run(app, host="127.0.0.1", port=8004, log_level="warning")
