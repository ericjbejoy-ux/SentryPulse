"""MVP runtime contracts for the unified single backend (backend.main:app).

Covers the demo-critical loop: live -> simulate (injects chaos) ->
triage (+pareto) -> heal webhook (resets twin) -> live NOMINAL again.
Groq is forced off (use_groq=false) so tests are deterministic offline.
"""
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_live_snapshot_shape():
    r = client.get("/api/v1/telemetry/live")
    assert r.status_code == 200
    body = r.json()
    for key in ("timestamp", "latency_ms", "cpu", "rps", "error_rate", "is_attacked"):
        assert key in body


def test_nodes_lists_four_topology_nodes():
    r = client.get("/api/v1/telemetry/nodes")
    assert r.status_code == 200
    assert len(r.json()["nodes"]) == 4


def test_simulation_injects_chaos_and_reset_clears_it():
    sim = client.post(
        "/api/v1/simulation/start",
        json={"permutations": 2000, "chaos_type": "THREADPOOL_LOCK"},
    )
    assert sim.status_code == 200
    assert sim.json()["status"] == "COMPLETED"
    assert sim.json()["permutations_executed"] == 2000

    live = client.get("/api/v1/telemetry/live").json()
    assert live["is_attacked"] is True  # drift != NOMINAL injects live chaos

    assert client.post("/api/v1/telemetry/reset").json() == {"status": "RESET"}
    assert client.get("/api/v1/telemetry/live").json()["is_attacked"] is False


def test_triage_rules_only_and_pareto_options():
    tri = client.post("/api/v1/triage?use_groq=false", json={})
    assert tri.status_code == 200
    body = tri.json()
    assert body["status"] == "SUCCESS"
    assert body["groq_live"] is False
    assert len(body["pareto_options"]) == 2

    pareto = client.get("/api/v1/pareto/options").json()
    assert pareto["status"] == "SUCCESS"
    assert [o["id"] for o in pareto["options"]] == ["A", "B"]
    assert pareto["options"][0]["is_recommended"] is True


def test_heal_webhook_falls_back_and_resets_twin():
    # Force chaos first so the reset path has something to clear.
    client.post(
        "/api/v1/simulation/start",
        json={"permutations": 2000, "chaos_type": "THREADPOOL_LOCK"},
    )
    heal = client.post(
        "/api/v1/n8n/trigger",
        json={"node_id": "cbs-db-primary", "anomaly_type": "THREADPOOL_LOCK"},
    )
    assert heal.status_code == 200
    body = heal.json()
    assert body["status"] == "SUCCESS"
    assert body["twin_state_updated"] is True

    live = client.get("/api/v1/telemetry/live").json()
    assert live["is_attacked"] is False
