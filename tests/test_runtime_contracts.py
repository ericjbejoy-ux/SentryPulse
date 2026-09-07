import asyncio
import unittest
from unittest.mock import AsyncMock, patch

from app.config import settings
from app.models.schemas import AnomalyTriggerPayload
from app.routers.webhook import trigger_n8n_healing
from app.services.twin_sync import TwinSyncService


class RuntimeContractTests(unittest.TestCase):
    def test_trigger_uses_fallback_when_n8n_is_unreachable(self):
        payload = AnomalyTriggerPayload(
            node_id="node-42",
            anomaly_type="latency_spike",
            severity="high",
            metadata={"region": "us-east"},
        )

        async def run_test():
            with patch("app.routers.webhook.httpx.AsyncClient") as mock_client:
                mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                    side_effect=Exception("n8n unavailable")
                )
                result = await trigger_n8n_healing(payload)
                self.assertTrue(result["fallback_engaged"])
                self.assertEqual(result["node_id"], "node-42")

        asyncio.run(run_test())

    def test_twin_sync_reports_false_when_state_file_is_missing(self):
        original_path = settings.TWIN_STATE_PATH
        settings.TWIN_STATE_PATH = "backend/telemetry/definitely_missing_twin.py"
        try:
            result = asyncio.run(TwinSyncService.update_twin_state("node-42", "latency_spike"))
            self.assertFalse(result)
        finally:
            settings.TWIN_STATE_PATH = original_path


if __name__ == "__main__":
    unittest.main()
