"""
Orchestrates Parallel Vector RAG & Graph RAG Retrieval with Fusion.
"""

from typing import Dict, Any
from rag.vector_store import VectorRAGRetriever
from rag.graph_store import GraphRAGRetriever
from workflow.fusion import HybridRAGFusionEngine

class HybridRetriever:
    """
    Executes parallel retrieval across ChromaDB vector store and NetworkX property graph,
    then fuses facts using the HybridRAGFusionEngine.
    """
    def __init__(self):
        self.vector_retriever = VectorRAGRetriever()
        self.graph_retriever = GraphRAGRetriever()
        self.fusion_engine = HybridRAGFusionEngine()

    def retrieve_and_fuse(self, vendor_name: str, query_text: str) -> Dict[str, Any]:
        """
        Runs parallel retrieval and returns fused, contradiction-checked evidence.
        """
        print(f"[HybridRetriever] Executing parallel Vector & Graph retrieval for {vendor_name}")
        
        # 1. Parallel / Consecutive Retrieval
        vector_facts = self.vector_retriever.query(query_text, top_k=3)
        graph_facts = self.graph_retriever.query(vendor_name, max_depth=2)

        # 2. Fusion & Contradiction Resolution
        fusion_result = self.fusion_engine.fuse(vector_facts, graph_facts)

        return {
            "vector_facts": vector_facts,
            "graph_facts": graph_facts,
            "fusion": fusion_result
        }
