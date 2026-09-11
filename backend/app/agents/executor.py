"""
Executor Agent Node for AutonoSource (POC v2.0).
Gathers multi-source evidence:
- Structured data (Vendor profile, financial records, compliance DB)
- Regulated Price Reference Data (NPPA/DPCO ceiling lookup via app.db.pricing)
- Unstructured Data via Hybrid RAG (Vector RAG + Graph RAG + Fusion)
- External Intelligence (Tavily search / web intelligence mock)
"""

from app.agents.state import WorkflowState
from app.rag_pipeline.hybrid_retriever import HybridRetriever
from app.db.pricing import lookup_ceiling_price
from app.rag_pipeline.web_scraper import vendor_scraper

# Instantiate shared hybrid retriever
hybrid_retriever = HybridRetriever()

def executor_agent(state: WorkflowState) -> WorkflowState:
    """
    Collects evidence bundle across 4 dimensions: Structured, Hybrid RAG, Pricing, External.
    """
    req = state.get("request")
    vendor_name = getattr(req, "vendor_name", None) or state.get("vendorName", "Global Pharma Logistics")
    deal_size = getattr(req, "deal_size", None) or state.get("dealSize", 500000.0)
    category = getattr(req, "category", None) or state.get("category", "Pharmaceuticals")
    details = getattr(req, "procurement_details", None) or state.get("procurementDetails", "Supply of bulk pharmaceutical formulations")
    quoted_unit_price = getattr(req, "quoted_unit_price", None) or state.get("quoted_unit_price")

    print(f"--- EXECUTOR AGENT: Gathering multi-source evidence for {vendor_name} ---")

    evidence = state.get("evidence_bundle", {})
    
    # 1. Structured Data
    evidence["structured"] = {
        "vendor_id": f"VEND-{abs(hash(vendor_name)) & 0xffff}",
        "vendor_name": vendor_name,
        "financial_audit_status": "Audited Clean",
        "annual_revenue": 24500000.0,
        "credit_score": 760,
        "compliance_certifications": ["ISO-9001", "GMP-Pharmaceutical", "Schedule-M"],
        "historical_deals_count": 14,
        "fda_483_citations": 0
    }

    # 2. Regulated Price Reference Data Lookup (NPPA/DPCO ceiling check)
    ceiling_price = lookup_ceiling_price(category)
    quoted_price = quoted_unit_price or deal_size
    
    if ceiling_price is not None:
        exceeds = quoted_price > ceiling_price
        excess_amount = max(0.0, quoted_price - ceiling_price)
    else:
        exceeds = False
        excess_amount = 0.0

    evidence["pricing_reference"] = {
        "category": category,
        "quoted_price": quoted_price,
        "regulated_ceiling_price": ceiling_price,
        "exceeds_ceiling": exceeds,
        "excess_amount": excess_amount
    }

    # 3. Hybrid RAG Retrieval (Vector + Graph Fusion)
    rag_result = hybrid_retriever.retrieve_and_fuse(vendor_name, details)
    evidence["hybrid_rag"] = rag_result

    # 4. External Intelligence (Web Scraper & Regulatory Docket Crawler)
    evidence["external_intelligence"] = vendor_scraper.scrape_vendor_intelligence(vendor_name, category)

    state["evidence_bundle"] = evidence
    state["stage"] = "SCORING"

    return state
