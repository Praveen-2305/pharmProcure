"""
Planner Agent Node for AutonoSource.
Analyzes structural signals (deal size, vendor history, product domain)
to determine LIGHT vs FULL investigation depth.
"""

from src.agents.state import WorkflowState
from src.models.schemas import InvestigationPlan, WorkflowStage

def planner_agent(state: WorkflowState) -> WorkflowState:
    """
    Evaluates procurement request parameters to select investigation depth.
    - LIGHT: Low deal size (< $100k) & standard category
    - FULL: High deal size (>= $100k) or specialized regulated category
    """
    req = state.get("request")
    deal_size = getattr(req, "deal_size", None) or state.get("dealSize", 0.0)
    vendor_name = getattr(req, "vendor_name", None) or state.get("vendorName", "Unknown Vendor")
    category = getattr(req, "category", None) or state.get("category", "Pharmaceuticals")

    print(f"--- PLANNER AGENT: Evaluating investigation plan for {vendor_name} (${deal_size:,.2f}) ---")
    
    is_high_value = deal_size >= 100000.0
    is_regulated_domain = str(category).lower() in ["pharmaceuticals", "medical_devices", "biologics", "vaccines"]

    if is_high_value or is_regulated_domain:
        plan = InvestigationPlan.FULL
    else:
        plan = InvestigationPlan.LIGHT

    state["investigationPlan"] = plan
    state["investigation_plan"] = plan.value
    state["stage"] = WorkflowStage.EXECUTING
    state["revision_count"] = 0
    state["revisionCount"] = 0
    state["max_revisions"] = 3
    state["maxRevisions"] = 3
    
    return state
