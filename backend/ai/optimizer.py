from typing import List, Dict, Any

class MultiObjectiveOptimizer:
    def __init__(self, alpha: float = 0.35, beta: float = 0.25, gamma: float = 0.20, delta: float = 0.20):
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma
        self.delta = delta

    def evaluate_configs(self, patch_options: List[Dict[str, Any]]) -> Dict[str, Any]:
        best_config = None
        lowest_penalty = float("inf")
        scored_options = []

        for option in patch_options:
            norm_latency = min(option.get("latency_impact_ms", 0) / 100.0, 1.0)
            norm_cost = min(option.get("estimated_cost", 0) / 500.0, 1.0)

            penalty = (
                (self.alpha * option.get("risk_score", 0.5)) +
                (self.beta * option.get("disruption_score", 0.5)) +
                (self.gamma * norm_latency) +
                (self.delta * norm_cost)
            )

            scored_item = {**option, "composite_penalty_score": round(penalty, 4)}
            scored_options.append(scored_item)

            if penalty < lowest_penalty:
                lowest_penalty = penalty
                best_config = scored_item

        return {
            "optimal_config": best_config,
            "all_evaluated_options": scored_options
        }
