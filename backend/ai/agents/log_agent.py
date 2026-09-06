import asyncio
import json
from typing import Dict, Any
from backend.core.config import groq_client
from backend.models.incident import IncidentEvent

class LogAgent:
    def __init__(self):
        self.model = "llama-3.3-70b-versatile"

    async def analyze_incident(self, incident: IncidentEvent) -> Dict[str, Any]:
        """Analyzes raw logs to determine root cause and immediate mitigation."""
        if not groq_client:
            return {"error": "Groq client not initialized. Check .env API key."}

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
                return {"error": "Received empty response from Groq LLM."}
            return json.loads(content)
        except Exception as e:
            return {"error": f"Log analysis failed: {str(e)}"}

log_agent = LogAgent()
