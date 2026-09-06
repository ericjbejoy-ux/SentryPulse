import networkx as nx
from typing import Dict, Any
from backend.models.node import NodeState
from backend.models.telemetry import TelemetryPayload

class DigitalTwinEngine:
    def __init__(self):
        self.graph = nx.DiGraph()
        self._initialize_baseline_topology()

    def _initialize_baseline_topology(self):
        """Builds the initial healthy state of the SentryPulse topology."""
        api = NodeState(node_id="api_gateway", node_type="service", status="healthy", latency_ms=12.5)
        db = NodeState(node_id="primary_db", node_type="database", status="healthy", latency_ms=5.0)

        # Populate graph using validated Pydantic dictionaries
        self.graph.add_node(api.node_id, **api.model_dump())
        self.graph.add_node(db.node_id, **db.model_dump())
        self.graph.add_edge(api.node_id, db.node_id, latency_ms=12)

    def ingest_telemetry(self, payload: TelemetryPayload):
        """Updates the graph state based on live telemetry."""
        if self.graph.has_node(payload.source_node):
            nx.set_node_attributes(self.graph, {payload.source_node: payload.metrics})

    def update_node_state(self, state: NodeState):
        """Updates a node's health status."""
        if self.graph.has_node(state.node_id):
            self.graph.nodes[state.node_id].update(state.model_dump())

    def get_topology_state(self) -> Dict[str, Any]:
        """Exports the graph state for the React Flow frontend."""
        # nx.node_link_data natively formats the graph for JS/React Flow
        return nx.node_link_data(self.graph)
