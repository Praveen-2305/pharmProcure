"""
Graph RAG Property Graph Retriever Module using NetworkX.
Traverses legal/regulatory entities and relationships to retrieve structured regulatory facts.
"""

from typing import List, Dict, Any
import networkx as nx
import os

class GraphRAGRetriever:
    """
    Manages property graph traversal over legal entities, obligations, and contract terms.
    """
    def __init__(self, storage_path: str = "backend/data/knowledge_graph.graphml"):
        self.storage_path = storage_path
        self.graph = nx.MultiDiGraph()
        self._build_initial_graph()

    def _build_initial_graph(self):
        """Builds initial legal & regulatory property graph."""
        # Add entity nodes
        self.graph.add_node("Vendor", type="Entity", name="Supplier")
        self.graph.add_node("NPPA_Ceiling", type="Regulation", limit=500000)
        self.graph.add_node("FDA_483", type="ComplianceIndicator", violations=0)
        self.graph.add_node("Liability_Clause", type="ContractTerm", cap_multiplier=1.5)

        # Add relationship edges
        self.graph.add_edge("Vendor", "NPPA_Ceiling", relation="GOVERNED_BY", priority=1.2)
        self.graph.add_edge("Vendor", "FDA_483", relation="AUDITED_FOR", priority=1.0)
        self.graph.add_edge("Vendor", "Liability_Clause", relation="BOUND_BY", priority=1.0)

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
                        "retriever_type": "graph",
                        "node": node,
                        "node_data": node_data,
                        "source_doc": "Regulatory_Entity_Graph",
                        "source_priority": 1.2
                    })
            else:
                # Default property graph facts for mock/demonstration
                facts = [
                    {
                        "fact_id": "graph_001",
                        "text": "Graph Node [NPPA_Ceiling]: Regulated price cap set at $500,000.",
                        "score": 1.0,
                        "retriever_type": "graph",
                        "source_doc": "Regulatory_Entity_Graph",
                        "source_priority": 1.2
                    },
                    {
                        "fact_id": "graph_002",
                        "text": "Graph Node [FDA_483]: 0 active regulatory citations recorded in past 24 months.",
                        "score": 0.5,
                        "retriever_type": "graph",
                        "source_doc": "Compliance_Graph",
                        "source_priority": 1.0
                    }
                ]
        except Exception as e:
            print(f"[GraphRAG] Traversal note: {e}")
            
        return facts
