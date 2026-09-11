"""
Risk Scorer Agent Node for AutonoSource (POC v2.0).
Computes 4D Risk Assessment:
1. Financial Risk
2. Compliance Risk
3. Contract Risk
4. Pricing Risk (against regulated ceiling reference dataset)
Includes overall confidence scoring and contradiction flag propagation.
"""

from workflow.state import WorkflowState, RiskAssessment, ContradictionFlag

def risk_scorer_agent(state: WorkflowState) -> WorkflowState:
    """
    Evaluates evidence bundle across all 4 risk dimensions and assigns unified confidence.
    """
    print("--- RISK SCORER AGENT: Computing 4D risk metrics ---")
    
    evidence = state["evidence_bundle"]
    structured = evidence.get("structured", {})
    pricing = evidence.get("pricing_reference", {})
    hybrid_rag = evidence.get("hybrid_rag", {})
    fusion = hybrid_rag.get("fusion", {})

    # 1. Financial Risk Evaluation
    financial_risk = "LOW"
    if structured.get("credit_score", 700) < 600:
        financial_risk = "HIGH"
    elif structured.get("credit_score", 700) < 700:
        financial_risk = "MEDIUM"

    # 2. Compliance Risk Evaluation
    compliance_risk = "LOW"
    if structured.get("fda_483_citations", 0) > 2:
        compliance_risk = "HIGH"
    elif structured.get("fda_483_citations", 0) > 0:
        compliance_risk = "MEDIUM"

    # 3. Contract Risk Evaluation
    contract_risk = "LOW"
    if fusion.get("has_unresolved_contradictions"):
        contract_risk = "MEDIUM"

    # 4. Pricing Risk Evaluation (New in v2.0)
    if pricing.get("exceeds_ceiling"):
        pricing_risk = "EXCEEDS_CEILING"
    elif pricing.get("regulated_ceiling_price") is not None:
        pricing_risk = "WITHIN_CEILING"
    else:
        pricing_risk = "INDETERMINATE"

    # 5. Overall Risk Calculation
    if financial_risk == "HIGH" or compliance_risk == "HIGH" or pricing_risk == "EXCEEDS_CEILING":
        overall_risk = "HIGH"
    elif contract_risk == "MEDIUM" or financial_risk == "MEDIUM":
        overall_risk = "MEDIUM"
    else:
        overall_risk = "LOW"

    # 6. Confidence Score Calculation
    base_confidence = fusion.get("final_confidence", 0.85)
    if pricing_risk == "INDETERMINATE":
        base_confidence *= 0.85

    confidence_score = round(max(0.1, min(1.0, base_confidence)), 2)

    # 7. Convert Contradiction Flags
    contradiction_flags = []
    for c in fusion.get("contradictions_detected", []):
        contradiction_flags.append(
            ContradictionFlag(
                fact_a=c.get("fact_a", "VectorFact"),
                fact_b=c.get("fact_b", "GraphFact"),
                description=c.get("description", "Retriever mismatch"),
                severity=c.get("severity", "MEDIUM")
            )
        )

    rationale = (
        f"Financial risk is {financial_risk} (Credit score {structured.get('credit_score')}). "
        f"Compliance risk is {compliance_risk} ({structured.get('fda_483_citations')} FDA citations). "
        f"Pricing risk is {pricing_risk} (Quoted: ${pricing.get('quoted_price', 0):,.2f}, "
        f"Ceiling: ${pricing.get('regulated_ceiling_price', 0):,.2f}). "
        f"Hybrid RAG confidence evaluated at {confidence_score}."
    )

    assessment = RiskAssessment(
        financial_risk=financial_risk,
        compliance_risk=compliance_risk,
        contract_risk=contract_risk,
        pricing_risk=pricing_risk,
        overall_risk=overall_risk,
        confidence_score=confidence_score,
        rationale=rationale,
        contradiction_flags=contradiction_flags
    )

    state["risk_assessment"] = assessment
    state["stage"] = "CRITIQUING"
    print(f"[RiskScorer] Assessment complete: Overall Risk={overall_risk}, Confidence={confidence_score}")

    return state
