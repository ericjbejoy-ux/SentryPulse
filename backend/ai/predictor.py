import math
from typing import Dict, Any

class AttackPredictor:
    @staticmethod
    def calculate_attack_probability(error_rate: float, latency_spike_ms: float, abnormal_log_count: int) -> float:
        raw_score = (error_rate * 0.4) + ((latency_spike_ms / 100.0) * 0.35) + (abnormal_log_count * 0.25)
        probability = 1.0 / (1.0 + math.exp(-0.05 * (raw_score - 50.0)))
        return round(probability, 3)

    @staticmethod
    def generate_voice_debrief_payload(incident_id: str, root_cause: str, winning_config: str) -> Dict[str, Any]:
        script = (
            f"Alert. Incident {incident_id} detected. Primary root cause isolated: {root_cause}. "
            f"Automated simulation completed. Applying remediation plan {winning_config} to restore system state."
        )
        return {
            "incident_id": incident_id,
            "voice_script": script,
            "status": "ready_for_audio_synthesis"
        }
