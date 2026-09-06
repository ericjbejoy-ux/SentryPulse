import asyncio
import json
import os
from typing import Dict, Any
from groq import AsyncGroq

from backend.ai.prompts.agent_prompts import LOG_AGENT_PROMPT, GIT_INSPECTOR_PROMPT, PATCH_SIMULATOR_PROMPT
from backend.ai.optimizer import MultiObjectiveOptimizer
from backend.ai.predictor import AttackPredictor

class AgentSwarmOrchestrator:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY", "mock-key-for-dev")
        self.client = AsyncGroq(api_key=api_key) if api_key != "mock-key-for-dev" else None
        self.optimizer = MultiObjectiveOptimizer()

    async def _run_agent(self, system_prompt: str, user_content: str) -> Dict[str, Any]:
        if not self.client:
            return {"mock": True}

        response = await self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

    async def execute_triage_swarm(self, raw_logs: str, git_diffs: str) -> Dict[str, Any]:
        log_task = self._run_agent(LOG_AGENT_PROMPT, f"Logs:\n{raw_logs}")
        git_task = self._run_agent(GIT_INSPECTOR_PROMPT, f"Commits:\n{git_diffs}")

        log_res, git_res = await asyncio.gather(log_task, git_task)

        if "mock" in log_res:
            log_res = {
                "affected_node": "auth-service-01",
                "error_type": "ConnectionPoolExhausted",
                "root_cause_summary": "Max DB connection limit reached under sudden burst load."
            }
            git_res = {
                "suspect_commit": "Commit #84f2",
                "author": "dev-team",
                "breaking_change_description": "Reduced max_connections pool size from 100 to 10."
            }

        patch_context = f"Node: {log_res.get('affected_node')}. Issue: {log_res.get('root_cause_summary')}"
        patch_res = await self._run_agent(PATCH_SIMULATOR_PROMPT, patch_context)

        if "mock" in patch_res:
            patch_res = {
                "patch_options": [
                    {"config_id": "Config A: Dynamic Scale", "risk_score": 0.15, "disruption_score": 0.10, "latency_impact_ms": 10.0, "estimated_cost": 40.0, "description": "Scale connection pool dynamically."},
                    {"config_id": "Config B: Failover Reroute", "risk_score": 0.40, "disruption_score": 0.50, "latency_impact_ms": 35.0, "estimated_cost": 15.0, "description": "Reroute traffic to secondary backup cluster."},
                    {"config_id": "Config C: Rate Limit", "risk_score": 0.20, "disruption_score": 0.70, "latency_impact_ms": 5.0, "estimated_cost": 5.0, "description": "Drop 30% of incoming auth traffic."}
                ]
            }

        optimization_results = self.optimizer.evaluate_configs(patch_res["patch_options"])
        attack_prob = AttackPredictor.calculate_attack_probability(error_rate=88.5, latency_spike_ms=450.0, abnormal_log_count=120)

        voice_debrief = AttackPredictor.generate_voice_debrief_payload(
            incident_id="INC-9042",
            root_cause=log_res.get("root_cause_summary"),
            winning_config=optimization_results["optimal_config"]["config_id"]
        )

        return {
            "incident_id": "INC-9042",
            "log_analysis": log_res,
            "git_analysis": git_res,
            "attack_probability": attack_prob,
            "remediation": optimization_results,
            "voice_debrief": voice_debrief
        }
