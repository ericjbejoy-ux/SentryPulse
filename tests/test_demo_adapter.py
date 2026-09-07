"""Contracts for the demo-site live adapter + victim restart hook.

No network: calibration/smoothing/mapping math and twin sample
thresholds are pure; HTTP paths are covered by the live E2E checklist
in demo-site/README.md.
"""
import unittest

from backend.routers.healing import supervisor_service_for
from backend.telemetry import adapter
from backend.telemetry.state import DigitalTwinState
from backend.models.twin_schemas import TopologyNodeId


class CalibrationTests(unittest.TestCase):
    def test_centroid_maps_to_training_centroid(self):
        lat, cpu = adapter.calibrate(TopologyNodeId.API_GATEWAY, 42.6, 41.5)
        self.assertAlmostEqual(lat, 55.0, places=1)
        self.assertAlmostEqual(cpu, 30.0, places=1)

    def test_cpu_pinned_regardless_of_input(self):
        _, cpu = adapter.calibrate(TopologyNodeId.CBS_DB_PRIMARY, 3.2, 99.9)
        self.assertAlmostEqual(cpu, 30.0, places=1)

    def test_live_scorer_never_refits(self):
        self.assertIsNone(adapter.live_scorer._refit_interval)

    def test_error_floor_keeps_nominal_in_basin(self):
        from backend.ml.anomaly import AnomalyScorer

        scorer = AnomalyScorer()
        floored = scorer.score(55.0, 30.0, adapter.ERROR_FLOOR)
        raw_zero = scorer.score(55.0, 30.0, 0.0)
        self.assertLess(floored, 0.35)
        self.assertLess(floored, raw_zero)

    def test_fault_deviation_survives_calibration(self):
        lat, cpu = adapter.calibrate(TopologyNodeId.CBS_DB_PRIMARY, 2000.0, 95.0)
        self.assertGreater(lat, 1000.0)
        self.assertAlmostEqual(cpu, 30.0, places=1)  # pinned by design

    def test_smoothing_converges_and_resets(self):
        adapter.reset_smoothing()
        node = TopologyNodeId.CORE_BANKING_SWITCH
        first = adapter.smooth(node, (60.0, 30.0, 0.0))
        self.assertEqual(first, (60.0, 30.0, 0.0))
        second = adapter.smooth(node, (70.0, 40.0, 0.0))
        self.assertAlmostEqual(second[0], 64.0, places=1)
        adapter.reset_smoothing()
        self.assertIsNone(adapter._ema[node])


class RestartMappingTests(unittest.TestCase):
    def test_ids_and_canvas_labels_map(self):
        self.assertEqual(supervisor_service_for("cbs-db-primary"), "dbsim")
        self.assertEqual(supervisor_service_for("postgres-cbs-primary"), "dbsim")
        self.assertEqual(supervisor_service_for("core-banking-switch"), "api")
        self.assertEqual(supervisor_service_for("kong-api-gateway"), "gateway")
        self.assertEqual(supervisor_service_for("idfc-api-gateway"), "gateway")

    def test_cache_and_unknown_have_no_victim(self):
        self.assertIsNone(supervisor_service_for("upi-settlement-cache"))
        self.assertIsNone(supervisor_service_for("nope"))
        self.assertIsNone(supervisor_service_for(""))


class WarmupTests(unittest.TestCase):
    def test_warmup_constants_sane(self):
        self.assertGreaterEqual(adapter.WARMUP_POLLS, 2)
        self.assertLess(adapter.WARMUP_SCORE_CAP, 0.35)

    def test_active_counter_resets(self):
        adapter._active[TopologyNodeId.API_GATEWAY] = 5
        adapter._active[TopologyNodeId.API_GATEWAY] = 0
        self.assertEqual(adapter._active[TopologyNodeId.API_GATEWAY], 0)


class LiveSampleTests(unittest.TestCase):
    def test_thresholds(self):
        twin = DigitalTwinState()
        twin.apply_live_sample(TopologyNodeId.API_GATEWAY, 45.0, 40.0, 100, 0.0, 0.9)
        node = [n for n in twin.as_node_list() if n.node_id == TopologyNodeId.API_GATEWAY][0]
        self.assertEqual(node.state, "CRITICAL")
        self.assertEqual(twin.source, "demo-site")
        twin.apply_live_sample(TopologyNodeId.API_GATEWAY, 45.0, 40.0, 100, 0.0, 0.5)
        node = [n for n in twin.as_node_list() if n.node_id == TopologyNodeId.API_GATEWAY][0]
        self.assertEqual(node.state, "DEGRADED")
        twin.apply_live_sample(TopologyNodeId.API_GATEWAY, 45.0, 40.0, 100, 0.0, 0.1)
        node = [n for n in twin.as_node_list() if n.node_id == TopologyNodeId.API_GATEWAY][0]
        self.assertEqual(node.state, "NOMINAL")
        # Displayed metrics are the raw measured values.
        self.assertEqual(node.latency_ms, 45.0)


if __name__ == "__main__":
    unittest.main()
