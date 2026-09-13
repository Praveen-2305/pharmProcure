"""
RAG Agent Node for AutonoSource (pharmProcure).
Executes parallel Hybrid RAG Retrieval (Vector Qdrant + NetworkX Graph Ontology)
and performs 4-step contradiction resolution and confidence scoring.
Runs in parallel with the Web Scraper Node.
"""

from src.agents.state import WorkflowState
from src.rag_pipeline.vector_store import VectorRAGRetriever
from src.rag_pipeline.graph_store import GraphRAGRetriever
from src.rag_pipeline.fusion import HybridRAGFusionEngine

# Shared retrieval and fusion engines
vector_retriever = VectorRAGRetriever()
graph_retriever = GraphRAGRetriever()
fusion_engine = HybridRAGFusionEngine()

def rag_node_agent(state: WorkflowState) -> WorkflowState:
    """
    Executes parallel Vector & Graph RAG retrieval, resolves regulatory
    contradictions, and merges fused evidence into the evidence bundle.
    """
    req = state.get("request")
    vendor_name = getattr(req, "vendor_name", None) or state.get("vendorName", "Global Pharma Logistics")
    details = getattr(req, "procurement_details", None) or state.get("procurementDetails", "Supply of bulk pharmaceutical formulations")

    print(f"--- RAG AGENT: Executing Hybrid RAG (Vector + Graph Fusion) for {vendor_name} ---")

    # 1. Parallel Retrieval
    vector_facts = vector_retriever.query(details, top_k=3)
    graph_facts = graph_retriever.query(vendor_name, max_depth=2)

    # 2. 4-Step Contradiction Resolution & Scoring Fusion
    fusion_result = fusion_engine.fuse(vector_facts, graph_facts)

    rag_result = {
        "vector_facts": vector_facts,
        "graph_facts": graph_facts,
        "fusion": fusion_result
    }
    
    # Merge into state evidence bundle
    return {"evidence_bundle": {"hybrid_rag": rag_result}}

