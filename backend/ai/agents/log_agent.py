import asyncio
import json
from typing import Dict, Any
from backend.ai.prompts.triage_prompts import (
    TRIAGE_SYSTEM_PROMPT,
    build_triage_user_prompt,
)
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

        prompt = build_triage_user_prompt(incident)

        def _call_groq():
            return groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": TRIAGE_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
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
