"""Contracts for the demo-site proxy router (backend/routers/demo.py).

Verifies the 503-when-synthetic guard, topology shape, and victim
forwarding URLs. HTTP is mocked; live E2E lives in demo-site/README.md.
"""
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from backend.core.config import settings
from backend.main import app

client = TestClient(app)


class _Resp:
    def __init__(self, payload):
        self._payload = payload

    def json(self):
        return self._payload

    def raise_for_status(self):
        pass


def _mock_client(get_payload=None, post_payload=None):
    mock = MagicMock()
    session = AsyncMock()
    session.get = AsyncMock(return_value=_Resp(get_payload or {}))
    session.post = AsyncMock(return_value=_Resp(post_payload or {}))
    mock.return_value.__aenter__.return_value = session
    return mock, session


class DemoDisabledTests(unittest.TestCase):
    def setUp(self):
        self._prev = settings.demo_site_url
        settings.demo_site_url = ""

    def tearDown(self):
        settings.demo_site_url = self._prev

    def test_all_routes_503_when_synthetic(self):
        self.assertEqual(client.get("/api/v1/demo/topology").status_code, 503)
        self.assertEqual(
            client.post("/api/v1/demo/fault", json={"target": "api", "type": "latency"}).status_code,
            503,
        )
        self.assertEqual(client.post("/api/v1/demo/kill/api").status_code, 503)
        self.assertEqual(client.post("/api/v1/demo/restart/api").status_code, 503)
        self.assertEqual(client.post("/api/v1/demo/clear").status_code, 503)


class DemoLiveTests(unittest.TestCase):
    def setUp(self):
        self._prev = settings.demo_site_url
        settings.demo_site_url = "http://127.0.0.1:8004"

    def tearDown(self):
        settings.demo_site_url = self._prev

    def test_topology_shape(self):
        mock, _ = _mock_client(get_payload={"api": {"pid": 1234}})
        with patch("backend.routers.demo.httpx.AsyncClient", mock):
            r = client.get("/api/v1/demo/topology")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertIn("source", body)
        self.assertEqual(len(body["nodes"]), 3)
        self.assertEqual(len(body["edges"]), 2)
        by_id = {n["node_id"]: n for n in body["nodes"]}
        self.assertNotIn("upi-settlement-cache", by_id)
        self.assertEqual(by_id["core-banking-switch"]["label"], "core-banking-switch")
        self.assertEqual(by_id["core-banking-switch"]["supervisor_svc"], "api")
        self.assertEqual(by_id["core-banking-switch"]["pid"], 1234)

    def test_fault_forwards_to_victim_port(self):
        mock, session = _mock_client(post_payload={"fault": {"extra_latency_ms": 2000.0}})
        with patch("backend.routers.demo.httpx.AsyncClient", mock):
            r = client.post(
                "/api/v1/demo/fault",
                json={"target": "core-banking-switch", "type": "latency", "latency_ms": 2000},
            )
        self.assertEqual(r.status_code, 200)
        url = session.post.await_args.args[0]
        self.assertIn(":8002/fault", url)
        self.assertEqual(r.json()["service"], "api")

    def test_fault_rejects_bad_type_and_target(self):
        self.assertEqual(
            client.post("/api/v1/demo/fault", json={"target": "api", "type": "nuke"}).status_code,
            422,
        )
        self.assertEqual(
            client.post("/api/v1/demo/fault", json={"target": "nope", "type": "latency"}).status_code,
            404,
        )

    def test_kill_and_restart_proxy(self):
        mock, session = _mock_client(post_payload={"service": "dbsim", "pid": 99})
        with patch("backend.routers.demo.httpx.AsyncClient", mock):
            r = client.post("/api/v1/demo/kill/db")
            self.assertEqual(r.status_code, 200)
            self.assertIn("/kill/dbsim", session.post.await_args.args[0])
        mock, session = _mock_client(post_payload={"service": "api", "pid": 100})
        with patch("backend.routers.demo.httpx.AsyncClient", mock):
            r = client.post("/api/v1/demo/restart/api")
            self.assertEqual(r.status_code, 200)
            self.assertIn("/restart/api", session.post.await_args.args[0])

    def test_clear_hits_all_victims(self):
        mock, session = _mock_client(post_payload={})
        with patch("backend.routers.demo.httpx.AsyncClient", mock):
            r = client.post("/api/v1/demo/clear")
        self.assertEqual(r.status_code, 200)
        urls = [c.args[0] for c in session.post.await_args_list]
        self.assertEqual(len(urls), 3)
        self.assertTrue(any(":8001/fault" in u for u in urls))
        self.assertTrue(any(":8002/fault" in u for u in urls))
        self.assertTrue(any(":8003/fault" in u for u in urls))


if __name__ == "__main__":
    unittest.main()
