import asyncio
import networkx as nx
from typing import Dict, Any
from backend.models.node import NodeState
from backend.models.telemetry import TelemetryPayload

class NetworkDigitalTwin:
    def __init__(self):
        self.graph = nx.DiGraph()
        self._lock = asyncio.Lock()
        self._initialize_baseline_topology()

    def _initialize_baseline_topology(self):
        """Builds the initial healthy state of the SentryPulse topology."""
        api = NodeState(node_id="api_gateway", node_type="service", status="healthy", latency_ms=12.5)
        db = NodeState(node_id="primary_db", node_type="database", status="healthy", latency_ms=5.0)

        self.graph.add_node(api.node_id, **api.model_dump())
        self.graph.add_node(db.node_id, **db.model_dump())
        self.graph.add_edge(api.node_id, db.node_id, latency_ms=12)

    async def ingest_telemetry(self, payload: TelemetryPayload) -> bool:
        """Thread-safe telemetry ingestion using Pydantic validation models."""
        async with self._lock:
            if self.graph.has_node(payload.source_node):
                nx.set_node_attributes(self.graph, {payload.source_node: payload.metrics})
                return True
            return False

    async def update_node_state(self, state: NodeState) -> bool:
        """Thread-safe node status updates."""
        async with self._lock:
            if self.graph.has_node(state.node_id):
                self.graph.nodes[state.node_id].update(state.model_dump())
                return True
            return False

    async def get_ego_subgraph(self, node_id: str, radius: int = 2) -> nx.DiGraph:
        """Isolates a local neighborhood subgraph for rapid AI simulations safely."""
        async with self._lock:
            if self.graph.has_node(node_id):
                undirected_view = self.graph.to_undirected()
                subgraph_nodes = nx.ego_graph(undirected_view, node_id, radius=radius).nodes()
                return self.graph.subgraph(subgraph_nodes).copy()
            return nx.DiGraph()

    async def get_topology_state(self) -> Dict[str, Any]:
        """Thread-safe export for the React Flow frontend."""
        async with self._lock:
            return nx.node_link_data(self.graph)

digital_twin = NetworkDigitalTwin()
