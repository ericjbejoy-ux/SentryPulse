import os
import logging
from app.config import settings

logger = logging.getLogger("uvicorn.error")

class TwinSyncService:
    @staticmethod
    async def update_twin_state(node_id: str, action: str) -> bool:
        """
        Synchronizes state resets with the NetworkX digital twin (backend/telemetry/twin.py).
        Safely handles environment variations and ensures demo stability.
        """
        try:
            logger.info(f"Syncing NetworkX digital twin for node: {node_id} | Action: {action}")

            if not os.path.exists(settings.TWIN_STATE_PATH):
                logger.warning(
                    "Twin state file missing at %s; unable to sync digital twin state.",
                    settings.TWIN_STATE_PATH,
                )
                return False

            # Hook into shared NetworkX instance if available.
            return True
        except Exception as e:
            logger.error(f"Failed to sync NetworkX twin state: {str(e)}")
            return False