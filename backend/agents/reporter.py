"""
Report Writer Agent Node for AutonoSource (POC v2.0).
Synthesizes the complete audit trail into a structured procurement report
ready for Human-in-the-Loop decision.
"""

from workflow.state import WorkflowState

def report_writer_agent(state: WorkflowState) -> WorkflowState:
    """
    Synthesizes procurement investigation findings into structured executive report.
    """
    print("--- REPORT WRITER AGENT: Synthesizing final procurement report ---")
    
    req = state["request"]
    assessment = state["risk_assessment"]
    evidence = state.get("evidence_bundle", {})

    # Generate recommendation based on overall risk
    if assessment.overall_risk == "LOW":
        recommendation = "APPROVE: Vendor meets all financial, compliance, and regulated pricing benchmarks."
    elif assessment.overall_risk == "MEDIUM":
        recommendation = "CONDITIONAL APPROVAL: Require senior executive sign-off and liability cap adjustment."
    else:
        recommendation = "REJECT / ESCALATE: High risk detected in compliance or pricing ceiling violation."

    report = {
        "vendor_name": req.vendor_name,
        "deal_size": req.deal_size,
        "category": req.category,
        "investigation_plan": state.get("investigation_plan", "FULL"),
        "vendor_summary": f"Audit evaluation for {req.vendor_name} under category '{req.category}'.",
        "risk_breakdown": {
            "financial_risk": assessment.financial_risk,
            "compliance_risk": assessment.compliance_risk,
            "contract_risk": assessment.contract_risk,
            "pricing_risk": assessment.pricing_risk,
            "overall_risk": assessment.overall_risk
        },
        "confidence_score": assessment.confidence_score,
        "recommendation": recommendation,
        "risk_explanation": assessment.rationale,
        "pricing_compliance_details": evidence.get("pricing_reference", {}),
        "contradictions_found": [c.dict() for c in assessment.contradiction_flags],
        "flagged_clauses": [
            {
                "clause": "Section 4.2",
                "text": "1.5x annual liability cap",
                "risk_level": assessment.contract_risk
            }
        ]
    }

    state["final_report"] = report
    state["stage"] = "AWAITING_APPROVAL"
    print(f"[ReportWriter] Report synthesized for {req.vendor_name}. Stage set to AWAITING_APPROVAL.")

    return state
