import asyncio
import json
import psutil
import websockets

SERVICE_PORTS = {
    8001: "api_gateway",
    8002: "auth_service",
    8003: "primary_db"
}

def check_services():
    active_ports = {}
    for conn in psutil.net_connections(kind='inet'):
        port = getattr(conn.laddr, 'port', None)
        if port in SERVICE_PORTS and conn.status == 'LISTEN' and conn.pid:
            active_ports[port] = conn.pid

    events = []
    for port, service_name in SERVICE_PORTS.items():
        if port in active_ports:
            try:
                proc = psutil.Process(active_ports[port])
                events.append({
                    "type": "telemetry",
                    "data": {
                        "node_id": service_name,
                        "metrics": {
                            "cpu_load": round(proc.cpu_percent(interval=0.05), 2),
                            "memory_usage": round(proc.memory_percent(), 2),
                            "status": "healthy"
                        }
                    }
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        else:
            # The service died or was killed by chaos.py
            events.append({
                "type": "simulate_failure",
                "data": {
                    "node_id": service_name,
                    "reason": f"Connection refused on port {port}. Process terminated unexpectedly."
                }
            })
    return events

async def stream_telemetry():
    uri = "ws://127.0.0.1:8000/ws/telemetry"
    async with websockets.connect(uri) as ws:
        print("[Agent] Connected to SentryPulse pipeline. Monitoring services...")
        reported_failures = set()

        while True:
            events = check_services()
            for event in events:
                if event["type"] == "simulate_failure":
                    node = event["data"]["node_id"]
                    if node not in reported_failures:
                        print(f"[Agent ALERT] Detected crash on {node}! Triggering incident pipeline...")
                        # Send the command your backend already understands
                        await ws.send("simulate_failure")
                        reported_failures.add(node)
                else:
                    await ws.send(json.dumps(event["data"]))
            await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(stream_telemetry())
