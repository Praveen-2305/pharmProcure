"""
Planner Agent Node for AutonoSource (POC v2.0).
Analyzes structural signals (deal size, vendor history, product domain)
to determine LIGHT vs FULL investigation depth.
"""

from workflow.state import WorkflowState

def planner_agent(state: WorkflowState) -> WorkflowState:
    """
    Evaluates procurement request parameters to select investigation depth.
    - LIGHT: Low deal size (< $100k) & standard category
    - FULL: High deal size (>= $100k) or specialized regulated category
    """
    req = state["request"]
    print(f"--- PLANNER AGENT: Evaluating investigation plan for {req.vendor_name} (Deal Size: ${req.deal_size:,.2f}) ---")
    
    # Business logic for investigation depth selection
    is_high_value = req.deal_size >= 100000.0
    is_regulated_domain = req.category.lower() in ["pharmaceuticals", "medical_devices", "biologics"]

    if is_high_value or is_regulated_domain:
        plan = "FULL"
        reason = "High deal size or regulated pharmaceutical domain requires comprehensive 4D risk investigation."
    else:
        plan = "LIGHT"
        reason = "Standard deal size and non-critical category allows streamlined investigation."

    state["investigation_plan"] = plan
    state["stage"] = "EXECUTING"
    print(f"[Planner] Assigned Strategy: {plan} ({reason})")
    
    return state
