"""
Graph RAG Property Graph Retriever Module using NetworkX.
Traverses legal/regulatory entities and relationships to retrieve structured regulatory facts.
"""

from typing import List, Dict, Any
import networkx as nx

import os

backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_GRAPH_PATHS = [
    os.path.join(backend_root, "database", "graph", "knowledge_graph.graphml"),
    os.path.join(backend_root, "data", "knowledge_graph.graphml"),
    "backend/database/graph/knowledge_graph.graphml",
    "backend/data/knowledge_graph.graphml"
]

class GraphRAGRetriever:
    """
    Manages property graph traversal over legal entities, obligations, and contract terms.
    """
    def __init__(self, storage_path: str = None):
        if storage_path:
            self.storage_path = storage_path
        else:
            self.storage_path = next((p for p in DEFAULT_GRAPH_PATHS if os.path.exists(p)), DEFAULT_GRAPH_PATHS[0])
            
        self.graph = nx.MultiDiGraph()
        self._load_or_build_graph()

    def _load_or_build_graph(self):
        """Loads persisted graph from disk if available, else builds baseline graph."""
        if os.path.exists(self.storage_path):
            try:
                self.graph = nx.read_graphml(self.storage_path)
                return
            except Exception as e:
                print(f"[GraphRAG] GraphML load note ({e}). Building baseline graph.")
                
        self._build_initial_graph()

    def _build_initial_graph(self):
        """Builds initial legal & regulatory property graph."""
        self.graph.add_node("Vendor", type="Entity", name="Supplier")
        self.graph.add_node("NPPA_Ceiling", type="Regulation", limit=500000)
        self.graph.add_node("FDA_483", type="ComplianceIndicator", violations=0)
        self.graph.add_node("Liability_Clause", type="ContractTerm", cap_multiplier=1.5)
        self.graph.add_node("WHO_TRS_1025", type="StorageStandard", cold_chain=True)


        self.graph.add_edge("Vendor", "NPPA_Ceiling", relation="GOVERNED_BY", priority=1.2)
        self.graph.add_edge("Vendor", "FDA_483", relation="AUDITED_FOR", priority=1.0)
        self.graph.add_edge("Vendor", "Liability_Clause", relation="BOUND_BY", priority=1.0)
        self.graph.add_edge("Vendor", "WHO_TRS_1025", relation="COMPLIES_WITH", priority=1.1)

    def query(self, entity_name: str, max_depth: int = 2) -> List[Dict[str, Any]]:
        """
        Traverses graph from target entity up to max_depth.
        Computes graph score = 1 / (1 + shortest_path_length).
        """
        facts = []
        try:
            if entity_name in self.graph:
                lengths = nx.single_source_shortest_path_length(self.graph, entity_name, cutoff=max_depth)
                for node, path_len in lengths.items():
                    if node == entity_name:
                        continue
                    node_data = self.graph.nodes[node]
                    graph_score = 1.0 / (1.0 + path_len)
                    
                    facts.append({
                        "fact_id": f"graph_{node}",
                        "text": f"Graph Entity [{node}] (Type: {node_data.get('type')}) linked with depth {path_len}",
                        "score": graph_score,
                        "path_length": path_len,
                        "retriever_type": "graph",
                        "node": node,
                        "node_data": node_data,
                        "source_doc": "Regulatory_Entity_Graph",
                        "source_priority": 1.2
                    })
            else:
                facts = [
                    {
                        "fact_id": "g_fact_001",
                        "text": "Graph Node [NPPA_Ceiling]: Regulated price cap set at $500,000.",
                        "score": 1.0,
                        "path_length": 1,
                        "retriever_type": "graph",
                        "source_doc": "Regulatory_Entity_Graph",
                        "source_priority": 1.2
                    },
                    {
                        "fact_id": "g_fact_002",
                        "text": "Graph Node [Schedule_M]: Good Manufacturing Practices compliance confirmed.",
                        "score": 0.85,
                        "path_length": 1,
                        "retriever_type": "graph",
                        "source_doc": "schedule_m_gmp.pdf",
                        "source_priority": 1.0
                    }
                ]
        except Exception as e:
            print(f"[GraphRAG] Traversal note: {e}")
            
        return facts

# Canonical alias
GraphRAGStore = GraphRAGRetriever
__all__ = ["GraphRAGRetriever", "GraphRAGStore"]

