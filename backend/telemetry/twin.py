import networkx as nx
from typing import List, Dict, Any, Optional
from backend.models.node import TopologyNode

class DigitalTwinGraph:
    def __init__(self):
        self.graph = nx.DiGraph()
        self._initialize_default_topology()

    def _initialize_default_topology(self):
        """Initializes default infrastructure graph layout."""
        default_nodes = [
            TopologyNode(id="ingress-lb", label="Ingress Load Balancer", type="load_balancer", latency_ms=2.1, connected_to=["auth-service-01", "api-gateway"]),
            TopologyNode(id="api-gateway", label="API Gateway", type="gateway", latency_ms=4.5, connected_to=["user-service", "payment-service"]),
            TopologyNode(id="auth-service-01", label="Auth Service", type="microservice", latency_ms=18.2, connected_to=["db-primary-01", "cache-redis"]),
            TopologyNode(id="user-service", label="User Profile Service", type="microservice", latency_ms=8.0, connected_to=["db-primary-01"]),
            TopologyNode(id="payment-service", label="Payment Gateway", type="microservice", latency_ms=15.0, connected_to=["db-primary-01"]),
            TopologyNode(id="db-primary-01", label="Primary PostgreSQL", type="database", latency_ms=1.2, connected_to=[]),
            TopologyNode(id="cache-redis", label="Redis Memory Cache", type="database", latency_ms=0.5, connected_to=[])
        ]
        self.update_topology(default_nodes)

    def update_topology(self, nodes: List[TopologyNode]):
        """Rebuilds/updates active graph state from incoming node telemetry snapshots."""
        for node in nodes:
            self.graph.add_node(
                node.id,
                label=node.label,
                type=node.type,
                status=node.status,
                latency_ms=node.latency_ms,
                error_rate=node.error_rate,
                cpu_usage=node.cpu_usage
            )
            for target_id in node.connected_to:
                # Add edge with weight based on target latency
                self.graph.add_edge(node.id, target_id, weight=node.latency_ms)

    def simulate_node_failure(self, failed_node_id: str) -> Dict[str, Any]:
        """Simulates a critical node failure and computes isolated network metrics."""
        if failed_node_id in self.graph:
            self.graph.nodes[failed_node_id]["status"] = "critical"
            self.graph.nodes[failed_node_id]["error_rate"] = 100.0

        reachable_from_ingress = False
        if "ingress-lb" in self.graph:
            try:
                # Check if path still exists around the failure
                paths = nx.single_source_shortest_path(self.graph, "ingress-lb")
                reachable_nodes = list(paths.keys())
            except Exception:
                reachable_nodes = []
        else:
            reachable_nodes = []

        return {
            "failed_node": failed_node_id,
            "total_nodes": self.graph.number_of_nodes(),
            "active_healthy_nodes": [n for n, d in self.graph.nodes(data=True) if d.get("status") != "critical"],
            "reachable_nodes_count": len(reachable_nodes)
        }

    def simulate_patch_reroute(self, source_node: str, new_target_node: str) -> Dict[str, Any]:
        """Simulates adding or redirecting traffic dynamically inside the Digital Twin."""
        self.graph.add_edge(source_node, new_target_node, weight=5.0)
        
        try:
            shortest_path = nx.shortest_path(self.graph, source="ingress-lb", target=new_target_node, weight="weight")
            path_latency = nx.path_weight(self.graph, shortest_path, weight="weight")
        except nx.NetworkXNoPath:
            shortest_path = []
            path_latency = float("inf")

        return {
            "patch_applied": f"Redirect {source_node} -> {new_target_node}",
            "simulated_shortest_path": shortest_path,
            "estimated_path_latency_ms": path_latency
        }

    def export_snapshot(self) -> List[Dict[str, Any]]:
        """Exports graph state formatted for consumption by Frontend React Flow Canvas."""
        exported = []
        for node_id, attrs in self.graph.nodes(data=True):
            neighbors = list(self.graph.successors(node_id))
            exported.append({
                "id": node_id,
                "label": attrs.get("label", node_id),
                "type": attrs.get("type", "microservice"),
                "status": attrs.get("status", "healthy"),
                "latency_ms": attrs.get("latency_ms", 0.0),
                "error_rate": attrs.get("error_rate", 0.0),
                "cpu_usage": attrs.get("cpu_usage", 0.0),
                "connected_to": neighbors
            })
        return exported
