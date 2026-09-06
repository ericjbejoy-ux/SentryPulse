import sys
import os
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

# Ensure root path resolution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.telemetry.twin import DigitalTwinGraph
from backend.ai.agents.swarm import AgentSwarmOrchestrator
from backend.core.websocket import manager

app = FastAPI(title="SentryPulse Autonomous War Room")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

twin = DigitalTwinGraph()
swarm = AgentSwarmOrchestrator()

@app.get("/api/health")
def health_check():
    return {"status": "online", "engine": "SentryPulse Digital Twin Core", "latency_ms": 1.83}

@app.get("/api/topology")
def get_topology():
    return {"nodes": twin.export_snapshot()}

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Broadcast snapshot every 2 seconds
            snapshot = twin.export_snapshot()
            await websocket.send_json({"type": "TELEMETRY_UPDATE", "data": snapshot})
            await asyncio.sleep(2.0)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/simulate-chaos")
async def trigger_chaos():
    """Simulates node failure and runs the parallel AI swarm."""
    twin.simulate_node_failure("auth-service-01")
    
    # Execute AI Swarm Triage
    raw_logs = "CRITICAL: ConnectionPoolExhausted in auth-service-01. Max limit 10 reached."
    git_diffs = "Commit #84f2 by dev-team: Reduced max_connections pool size from 100 to 10."
    
    triage_results = await swarm.execute_triage_swarm(raw_logs, git_diffs)
    
    # Broadcast chaos state and AI mitigation plan via WebSockets
    await manager.broadcast({"type": "INCIDENT_ALERT", "data": triage_results})
    await manager.broadcast({"type": "TELEMETRY_UPDATE", "data": twin.export_snapshot()})
    
    return {"status": "chaos_triggered", "triage": triage_results}

@app.post("/api/apply-patch")
async def apply_patch():
    """Applies patch reroute inside the Digital Twin."""
    reroute_res = twin.simulate_patch_reroute("ingress-lb", "cache-redis")
    # Reset failure status
    for n in twin.graph.nodes:
        twin.graph.nodes[n]["status"] = "healthy"
        twin.graph.nodes[n]["error_rate"] = 0.0
        
    await manager.broadcast({"type": "TELEMETRY_UPDATE", "data": twin.export_snapshot()})
    return {"status": "patch_applied", "details": reroute_res}

@app.get("/", response_class=HTMLResponse)
def serve_testing_dashboard():
    """Embedded Test Dashboard to visually inspect the Digital Twin & AI Swarm."""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>SentryPulse Test War Room</title>
        <style>
            body { font-family: monospace; background: #0a0e17; color: #00ffcc; padding: 20px; }
            h1 { color: #fff; border-bottom: 2px solid #00ffcc; padding-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
            .card { background: #121824; border: 1px solid #1f293d; padding: 15px; border-radius: 8px; }
            button { background: #ff0055; color: white; border: none; padding: 12px 20px; font-weight: bold; cursor: pointer; border-radius: 4px; margin-right: 10px; }
            button.patch { background: #00ffcc; color: #000; }
            pre { background: #05080e; padding: 10px; border-radius: 5px; color: #33ff88; overflow-x: auto; max-height: 350px; }
            .status-healthy { color: #00ffcc; }
            .status-critical { color: #ff0055; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>SentryPulse // Autonomous War Room Test Suite</h1>
        <div>
            <button onclick="triggerChaos()">💥 Inject Chaos (Simulate Failure)</button>
            <button class="patch" onclick="applyPatch()">🛡️ Apply AI Recommended Patch</button>
        </div>
        <div class="grid">
            <div class="card">
                <h2>Digital Twin Live Network Nodes</h2>
                <div id="nodes-container">Connecting to WebSocket...</div>
            </div>
            <div class="card">
                <h2>AI Agent Swarm & Remediation Output</h2>
                <pre id="ai-output">Awaiting incident trigger...</pre>
            </div>
        </div>

        <script>
            const ws = new WebSocket('ws://' + window.location.host + '/ws/telemetry');
            
            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.type === 'TELEMETRY_UPDATE') {
                    renderNodes(msg.data);
                } else if (msg.type === 'INCIDENT_ALERT') {
                    document.getElementById('ai-output').innerText = JSON.stringify(msg.data, null, 2);
                }
            };

            function renderNodes(nodes) {
                let html = '<ul>';
                nodes.forEach(n => {
                    const statusClass = n.status === 'critical' ? 'status-critical' : 'status-healthy';
                    html += `<li><strong>${n.label}</strong> (${n.id}) - <span class="${statusClass}">${n.status.toUpperCase()}</span> | Latency: ${n.latency_ms}ms</li>`;
                });
                html += '</ul>';
                document.getElementById('nodes-container').innerHTML = html;
            }

            async function triggerChaos() {
                await fetch('/api/simulate-chaos', { method: 'POST' });
            }

            async function applyPatch() {
                await fetch('/api/apply-patch', { method: 'POST' });
                document.getElementById('ai-output').innerText = "Patch successfully deployed to Digital Twin. All system nodes restored to HEALTHY.";
            }
        </script>
    </body>
    </html>
    """
