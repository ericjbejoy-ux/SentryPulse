import asyncio
import json
from typing import Dict, Any
from backend.core.config import groq_client
from backend.models.incident import IncidentEvent

class LogAgent:
    def __init__(self):
        # Switching to Groq's openai/gpt-oss-20b production model
        self.model = "openai/gpt-oss-20b"

    async def analyze_incident(self, incident: IncidentEvent) -> Dict[str, Any]:
        """Analyzes raw logs to determine root cause and immediate mitigation."""
        if not groq_client:
            return {
                "root_cause": "Groq client not initialized. Check your .env API key.",
                "recommended_action": "Verify GROQ_API_KEY environment variable."
            }

        prompt = f"""
        You are an autonomous site reliability engineer. Analyze this network incident:
        Incident ID: {incident.incident_id}
        Affected Nodes: {', '.join(incident.affected_nodes)}
        Severity: {incident.severity}
        Raw Logs: {incident.raw_logs}

        Return a JSON object with exactly two keys:
        - "root_cause": A concise explanation of why the failure occurred.
        - "recommended_action": The immediate mitigation step to isolate the blast radius.
        """

        def _call_groq():
            return groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                response_format={"type": "json_object"},
                temperature=0.1
            )

        try:
            response = await asyncio.to_thread(_call_groq)
            content = response.choices[0].message.content
            if not content:
                return {"root_cause": "Empty LLM response", "recommended_action": "Check service logs."}
            return json.loads(content)
        except Exception as e:
            # Graceful fallback so the WebSocket pipeline never crashes
            return {
                "root_cause": f"AI analysis unavailable: {str(e)}",
                "recommended_action": "Isolate affected nodes manually via dashboard override."
            }

log_agent = LogAgent()
