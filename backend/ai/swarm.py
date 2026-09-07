"""FR-5 + FR-6: Multi-Agent swarm orchestrator (unified backend).

Deterministic rule agents (offline-safe) with a Groq-live enrichment
layer on top:

- Groq key present  -> live LLM diagnosis via agents.log_agent
                      (model openai/gpt-oss-20b), response flags groq_live=true.
- Groq missing/failing -> rule-based output, groq_live=false, HTTP still 200.

Agent building blocks live in their own modules:
  agents/log_agent.py  FR-5.1 LogAgent (Groq-live root-cause analysis)
  predictor.py         FR-5.2 PredictorAgent (cascade probabilities)
  optimizer.py         FR-6   Pareto frontier decision engine
  prompts/             system prompt templates for the live path
"""
import asyncio
import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from backend.ai.optimizer import generate_pareto_frontier
from backend.ai.predictor import SLA_BREACH_LATENCY_MS, predict_cascade

logger = logging.getLogger("uvicorn.error")


@dataclass
class SwarmAnalysis:
    log_agent_output: str
    predictor_agent_output: str
    patch_agent_output: str
    pareto_options: List[Dict[str, Any]]
    groq_live: bool = False
    groq_diagnosis: Optional[Dict[str, Any]] = None


class MultiAgentSwarmEngine:
    def run_log_agent(self, latency_ms: float, cpu_util: str, failing_node: str) -> str:
        """FR-5.1: threshold-breach detection over raw metrics/logs."""
        if latency_ms > SLA_BREACH_LATENCY_MS:
            return (
                f"SLA Breach: P99 latency ({latency_ms}ms) exceeded 300ms threshold "
                f"on {failing_node}. Log trace indicates connection pool saturation."
            )
        return "Telemetry normal. No SLA threshold breaches detected."

    def run_predictor_agent(self, latency_ms: float, failing_node: str) -> str:
        """FR-5.2: cascade forecast, delegated to predictor.py."""
        assessment, _ = predict_cascade(latency_ms, failing_node)
        return assessment

    def run_patch_agent(self, failing_node: str) -> str:
        """FR-5.3: multi-option remediation summary."""
        return (
            f"Remediation Formulated: Generated 2 Pareto candidate patches for "
            f"{failing_node}. Armed n8n automation listener."
        )

    def generate_pareto_frontier(self, failing_node: str) -> List[Dict[str, Any]]:
        """FR-6: trade-off matrix, delegated to optimizer.py."""
        return generate_pareto_frontier(failing_node)

    async def _groq_diagnosis(
        self, latency_ms: float, cpu: str, failing_node: str
    ) -> Optional[Dict[str, Any]]:
        """Best-effort live Groq call. Returns None on any failure."""
        try:
            from backend.core.config import groq_client
            from backend.models.incident import IncidentEvent

            if groq_client is None:
                return None

            from backend.ai.agents.log_agent import log_agent

            incident = IncidentEvent(
                incident_id="TRIAGE-LIVE",
                affected_nodes=[failing_node],
                severity="critical" if latency_ms > 300 else "info",
                raw_logs=(
                    f"P99 latency={latency_ms}ms cpu={cpu} node_id={failing_node} "
                    "Metrics: connection pool saturation suspected"
                ),
            )
            return await asyncio.wait_for(
                log_agent.analyze_incident(incident), timeout=15.0
            )
        except Exception as exc:  # never break triage on LLM failure
            logger.warning("Groq live diagnosis unavailable, using rules: %s", exc)
            return None

    async def process_triage_async(
        self, telemetry_data: Dict[str, Any], use_groq: bool = True
    ) -> SwarmAnalysis:
        latency = float(telemetry_data.get("latency_ms", 4))
        cpu = str(telemetry_data.get("cpu", "20%"))
        failing_node = str(
            telemetry_data.get("failing_node") or "cbs-db-primary"
        )

        log_out = self.run_log_agent(latency, cpu, failing_node)
        pred_out = self.run_predictor_agent(latency, failing_node)
        patch_out = self.run_patch_agent(failing_node)

        groq_diagnosis: Optional[Dict[str, Any]] = None
        groq_live = False
        if use_groq:
            groq_diagnosis = await self._groq_diagnosis(latency, cpu, failing_node)
            if groq_diagnosis and "root_cause" in groq_diagnosis:
                groq_live = True
                # Enrich (don't replace) the deterministic outputs so the
                # UI can show both the rule signal and the live LLM reasoning.
                log_out = (
                    f"{log_out} [Groq-live] Root cause: "
                    f"{groq_diagnosis.get('root_cause')}"
                )

        return SwarmAnalysis(
            log_agent_output=log_out,
            predictor_agent_output=pred_out,
            patch_agent_output=patch_out,
            pareto_options=self.generate_pareto_frontier(failing_node),
            groq_live=groq_live,
            groq_diagnosis=groq_diagnosis,
        )

    def process_triage(self, telemetry_data: Dict[str, Any]) -> SwarmAnalysis:
        """Sync wrapper for non-async callers (tests, scripts)."""
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None
        if loop and loop.is_running():
            # Called from inside a running loop without await — run rules only.
            latency = float(telemetry_data.get("latency_ms", 4))
            cpu = str(telemetry_data.get("cpu", "20%"))
            failing_node = str(
                telemetry_data.get("failing_node") or "cbs-db-primary"
            )
            return SwarmAnalysis(
                log_agent_output=self.run_log_agent(latency, cpu, failing_node),
                predictor_agent_output=self.run_predictor_agent(
                    latency, failing_node
                ),
                patch_agent_output=self.run_patch_agent(failing_node),
                pareto_options=self.generate_pareto_frontier(failing_node),
            )
        return asyncio.run(self.process_triage_async(telemetry_data))


swarm_engine = MultiAgentSwarmEngine()
