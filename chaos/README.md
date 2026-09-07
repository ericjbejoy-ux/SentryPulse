# Chaos harness (optional live-failure injector)

Drives the legacy `WS /ws/telemetry` path with real OS-level process
telemetry, so you can demo a genuine crash instead of a simulated one.

Needs extra deps the server itself doesn't require:

```bash
pip install psutil websockets
```

## Usage (3 terminals, backend already on :8000)

```bash
python chaos/cluster.py      # spawns dummy services on :8001/:8002/:8003
python chaos/host_agent.py   # streams per-process telemetry to the backend
python chaos/chaos.py        # SIGKILLs :8003 to simulate a primary_db crash
```

| Script | Role |
| :--- | :--- |
| `cluster.py` | Spawns 3 dummy `http.server` services via multiprocessing |
| `host_agent.py` | Polls ports with `psutil`, forwards telemetry / crash alerts over WebSocket |
| `chaos.py` | Finds the PID on :8003 and kills it (the injected incident) |
