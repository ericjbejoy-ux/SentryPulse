"""System prompt templates for the AI swarm (Groq-live path).

The LogAgent renders these into the chat call; every prompt demands a
strict two-key JSON object so the response parses deterministically.
"""
from backend.models.incident import IncidentEvent

TRIAGE_SYSTEM_PROMPT = (
    "You are an autonomous site reliability engineer. Analyze the network "
    "incident and return a JSON object with exactly two keys: "
    '"root_cause" (concise explanation of why the failure occurred) and '
    '"recommended_action" (immediate mitigation step to isolate the blast '
    "radius). Return JSON only."
)


def build_triage_user_prompt(incident: IncidentEvent) -> str:
    return (
        f"Incident ID: {incident.incident_id}\n"
        f"Affected Nodes: {', '.join(incident.affected_nodes)}\n"
        f"Severity: {incident.severity}\n"
        f"Raw Logs: {incident.raw_logs}"
    )
