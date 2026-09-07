"""Runtime contracts for the unified self-healing webhook.

Replaces the legacy app.* variant: verifies the demo fallback engages
when n8n is unreachable, the direct path succeeds when n8n answers 200,
and every heal resets the live twin back to NOMINAL (FR-7.3).
"""
import asyncio
import unittest
from unittest.mock import AsyncMock, patch

from backend.routers.healing import AnomalyTriggerPayload, trigger_healing
from backend.telemetry.state import twin_state
from backend.models.twin_schemas import TopologyNodeId


def _payload() -> AnomalyTriggerPayload:
    return AnomalyTriggerPayload(
        node_id="cbs-db-primary",
        anomaly_type="THREADPOOL_LOCK",
        severity="high",
        metadata={"region": "us-east"},
    )


class HealingContractTests(unittest.TestCase):
    def test_fallback_engages_when_n8n_is_unreachable(self):
        async def run_test():
            with patch(
                "backend.routers.healing.httpx.AsyncClient"
            ) as mock_client:
                mock_client.return_value.__aenter__.return_value.post = (
                    AsyncMock(side_effect=Exception("n8n unavailable"))
                )
                result = await trigger_healing(_payload())
                self.assertEqual(result.status, "SUCCESS")
                self.assertTrue(result.fallback_engaged)
                self.assertEqual(result.node_id, "cbs-db-primary")
                self.assertTrue(result.twin_state_updated)

        asyncio.run(run_test())

    def test_direct_path_when_n8n_confirms(self):
        async def run_test():
            with patch(
                "backend.routers.healing.httpx.AsyncClient"
            ) as mock_client:
                response = AsyncMock()
                response.raise_for_status = AsyncMock()
                mock_client.return_value.__aenter__.return_value.post = (
                    AsyncMock(return_value=response)
                )
                result = await trigger_healing(_payload())
                self.assertEqual(result.status, "SUCCESS")
                self.assertFalse(result.fallback_engaged)
                self.assertTrue(result.twin_state_updated)

        asyncio.run(run_test())

    def test_heal_resets_live_twin_to_nominal(self):
        twin_state.inject_chaos(TopologyNodeId.CBS_DB_PRIMARY)
        self.assertTrue(twin_state.as_flat_snapshot().is_attacked)
        asyncio.run(trigger_healing(_payload()))
        live = twin_state.as_flat_snapshot()
        self.assertFalse(live.is_attacked)
        self.assertIsNone(live.failing_node)


if __name__ == "__main__":
    unittest.main()
