"""
Planner Agent Node for AutonoSource.
Analyzes structural signals (deal size, vendor history, product domain)
to determine LIGHT vs FULL investigation depth.
"""

from src.agents.state import WorkflowState
from src.models.schemas import InvestigationPlan, WorkflowStage
from src.db.session import case_store
from src.prompts.planner_prompt import PLANNER_SYSTEM_PROMPT, get_planner_prompt

def planner_agent(state: WorkflowState) -> WorkflowState:
    """
    Evaluates procurement request parameters to select investigation depth.
    Guided by PLANNER_SYSTEM_PROMPT criteria:
    - LIGHT: Vendor profile already cached in SQL Database.
    - FULL: New vendor missing from SQL Database (Requires Web Scraping & RAG).
    """
    req = state.get("request")
    deal_size = getattr(req, "deal_size", None) or state.get("dealSize", 0.0)
    vendor_name = getattr(req, "vendor_name", None) or state.get("vendorName", "Unknown Vendor")
    category = getattr(req, "category", None) or state.get("category", "Pharmaceuticals")
    details = getattr(req, "procurement_details", None) or state.get("procurementDetails", "Standard pharmaceutical supply")

    prompt_context = get_planner_prompt(vendor_name, deal_size, category, details)
    print(f"--- PLANNER AGENT: Evaluating investigation plan for {vendor_name} (₹{deal_size:,.2f} INR) ---")
    
    # Check SQL cache for vendor profile
    cached_profile = case_store.get_vendor_profile(vendor_name)

    if cached_profile:
        print(f"  -> Cache HIT for {vendor_name}. Using LIGHT pipeline.")
        plan = InvestigationPlan.LIGHT
        state["cached_vendor_profile"] = cached_profile
    else:
        print(f"  -> Cache MISS for {vendor_name}. Routing to FULL pipeline (RAG + Scraping).")
        plan = InvestigationPlan.FULL


    state["investigationPlan"] = plan
    state["investigation_plan"] = plan.value
    state["stage"] = WorkflowStage.EXECUTING
    state["revision_count"] = 0
    state["revisionCount"] = 0
    state["max_revisions"] = 3
    state["maxRevisions"] = 3
    
    return state
