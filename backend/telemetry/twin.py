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
        """Builds the initial healthy state of the SentryPulse topology.

        Mirrors the SRS section 2 node tiers so the legacy WebSocket path
        and the canonical DigitalTwinState never disagree on node ids.
        """
        nodes = [
            NodeState(node_id="idfc-api-gateway", node_type="gateway", status="healthy", latency_ms=12.5),
            NodeState(node_id="core-banking-switch", node_type="service", status="healthy", latency_ms=28.0),
            NodeState(node_id="cbs-db-primary", node_type="database", status="healthy", latency_ms=5.0),
            NodeState(node_id="upi-settlement-cache", node_type="cache", status="healthy", latency_ms=4.0),
        ]
        for node in nodes:
            self.graph.add_node(node.node_id, **node.model_dump())
        self.graph.add_edge("idfc-api-gateway", "core-banking-switch", latency_ms=12)
        self.graph.add_edge("core-banking-switch", "cbs-db-primary", latency_ms=9)
        self.graph.add_edge("core-banking-switch", "upi-settlement-cache", latency_ms=6)

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
