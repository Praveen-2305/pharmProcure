"""
Executor Agent Node for AutonoSource (POC v2.0).
Gathers multi-source evidence:
- Structured data (Vendor profile, financial records, compliance DB)
- Regulated Price Reference Data (NPPA/DPCO ceiling index)
- Unstructured Data via Hybrid RAG (Vector RAG + Graph RAG + Fusion)
- External Intelligence (Tavily search API integration)
"""

from workflow.state import WorkflowState
from rag.hybrid_retriever import HybridRetriever

# Instantiate shared hybrid retriever
hybrid_retriever = HybridRetriever()

def executor_agent(state: WorkflowState) -> WorkflowState:
    """
    Collects evidence bundle across 4 dimensions: Structured, Hybrid RAG, Pricing, External.
    """
    req = state["request"]
    print(f"--- EXECUTOR AGENT: Gathering multi-source evidence for {req.vendor_name} ---")

    evidence = state.get("evidence_bundle", {})
    
    # 1. Structured Data (Mocked MongoDB lookup)
    evidence["structured"] = {
        "vendor_id": f"VEND-{hash(req.vendor_name) & 0xffff}",
        "vendor_name": req.vendor_name,
        "financial_audit_status": "Audited Clean",
        "annual_revenue": 24500000.0,
        "credit_score": 780,
        "compliance_certifications": ["ISO-9001", "GMP-Pharmaceutical"],
        "historical_deals_count": 14,
        "fda_483_citations": 0
    }

    # 2. Regulated Price Reference Data Lookup (e.g. NPPA/DPCO ceiling check)
    # Default reference ceiling set for demo
    ceiling_price = 450000.0
    quoted_price = req.quoted_unit_price or req.deal_size
    
    evidence["pricing_reference"] = {
        "category": req.category,
        "quoted_price": quoted_price,
        "regulated_ceiling_price": ceiling_price,
        "exceeds_ceiling": quoted_price > ceiling_price,
        "excess_amount": max(0.0, quoted_price - ceiling_price)
    }

    # 3. Hybrid RAG Retrieval (Vector + Graph Fusion)
    rag_result = hybrid_retriever.retrieve_and_fuse(req.vendor_name, req.procurement_details)
    evidence["hybrid_rag"] = rag_result

    # 4. External Intelligence (Tavily / Search API mock)
    evidence["external_intelligence"] = {
        "litigation_records": ["No active lawsuits found in federal docket"],
        "news_sentiment": "Positive",
        "regulatory_warnings": []
    }

    state["evidence_bundle"] = evidence
    state["stage"] = "SCORING"
    print(f"[Executor] Bundle compiled. Hybrid RAG Confidence: {rag_result['fusion']['final_confidence']}")

    return state
