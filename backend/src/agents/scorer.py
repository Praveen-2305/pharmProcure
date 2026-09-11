"""
Risk Scorer Agent Node for AutonoSource (POC v2.0).
Computes 4D Risk Assessment:
1. Financial Risk
2. Compliance Risk
3. Contract Risk
4. Pricing Risk (NPPA/DPCO ceiling index check)
Produces both Pydantic RiskAssessment and legacy state properties.
"""

from src.agents.state import WorkflowState
from src.models.schemas import (
    RiskAssessment,
    RiskItem,
    RiskLevel,
    PricingRisk,
    PricingRiskStatus
)

def risk_scorer_agent(state: WorkflowState) -> WorkflowState:
    """
    Evaluates evidence bundle across all 4 risk dimensions and assigns unified confidence.
    """
    print("--- RISK SCORER AGENT: Computing 4D risk metrics ---")
    
    evidence = state.get("evidence_bundle", {})
    structured = evidence.get("structured", {})
    pricing = evidence.get("pricing_reference", {})
    hybrid_rag = evidence.get("hybrid_rag", {})
    fusion = hybrid_rag.get("fusion", {})
    ext_intel = evidence.get("external_intelligence", {})
    reg_warnings = ext_intel.get("regulatory_warnings", [])
    litigation = ext_intel.get("litigation_records", [])
    recalls = ext_intel.get("product_recalls", [])
    ext_risk_signal = ext_intel.get("risk_signal", "LOW")

    # 1. Financial Risk Evaluation
    financial_level = RiskLevel.LOW
    financial_rationale = "Healthy liquidity and clean financial audit."
    credit_score = structured.get("credit_score", 750)
    if credit_score < 600:
        financial_level = RiskLevel.HIGH
        financial_rationale = f"Severe financial distress flagged (Credit score: {credit_score})."
    elif credit_score < 700:
        financial_level = RiskLevel.MEDIUM
        financial_rationale = f"Moderate credit profile ({credit_score}). Stricter payment milestones required."

    # Incorporate external commercial litigation / arbitration into financial risk
    has_commercial_litigation = any(
        "arbitration" in lit.lower() or "lawsuit" in lit.lower() or "dispute" in lit.lower()
        for lit in litigation
    )
    if has_commercial_litigation:
        lit_summary = "; ".join(litigation)
        if financial_level == RiskLevel.LOW:
            financial_level = RiskLevel.MEDIUM
            financial_rationale = f"{financial_rationale} Active external legal proceedings flagged: {lit_summary}"
        else:
            financial_rationale = f"{financial_rationale} Compounded by active legal dispute: {lit_summary}"

    # 2. Compliance Risk Evaluation
    compliance_level = RiskLevel.LOW
    compliance_rationale = "Schedule M GMP and ISO standards verified; clean regulatory record."
    citations = structured.get("fda_483_citations", 0)
    if citations > 2:
        compliance_level = RiskLevel.HIGH
        compliance_rationale = f"Critical non-compliance: {citations} regulatory citations on file."
    elif citations > 0:
        compliance_level = RiskLevel.MEDIUM
        compliance_rationale = f"{citations} minor inspection notice observed."

    # Incorporate external web scraping regulatory warnings & product recalls
    if reg_warnings or recalls:
        combined_warnings = "; ".join(reg_warnings + recalls)
        is_severe = (
            "show-cause" in combined_warnings.lower()
            or "suspension" in combined_warnings.lower()
            or ext_risk_signal == "HIGH"
        )
        if is_severe:
            compliance_level = RiskLevel.HIGH
            compliance_rationale = f"Critical regulatory alert flagged via external intelligence: {combined_warnings}"
        elif compliance_level != RiskLevel.HIGH:
            compliance_level = RiskLevel.MEDIUM
            compliance_rationale = f"Regulatory advisory noted via external intelligence: {combined_warnings}"

    # 3. Contract Risk Evaluation
    contract_level = RiskLevel.LOW
    contract_rationale = "Standard indemnification terms and mutually balanced 30-day cure period."
    if fusion.get("has_unresolved_contradictions"):
        contract_level = RiskLevel.MEDIUM
        contract_rationale = "Unresolved terms or contradictory conditions detected between contract and regulatory rules."


    # 4. Pricing Risk Evaluation (Deterministic NPPA/DPCO ceiling check)
    quoted_price = float(pricing.get("quoted_price", 0.0))
    ceiling_price = pricing.get("regulated_ceiling_price")
    
    if ceiling_price is None:
        pricing_status = PricingRiskStatus.INDETERMINATE
        excess_amount = None
    elif pricing.get("exceeds_ceiling", False):
        pricing_status = PricingRiskStatus.EXCEEDS_CEILING
        excess_amount = float(pricing.get("excess_amount", max(0.0, quoted_price - ceiling_price)))
    else:
        pricing_status = PricingRiskStatus.WITHIN_CEILING
        excess_amount = 0.0

    # 5. Overall Risk Calculation (Maximum severity across dimensions)
    if (
        financial_level == RiskLevel.HIGH
        or compliance_level == RiskLevel.HIGH
        or pricing_status == PricingRiskStatus.EXCEEDS_CEILING
    ):
        overall_risk = RiskLevel.HIGH
    elif (
        contract_level == RiskLevel.MEDIUM
        or financial_level == RiskLevel.MEDIUM
        or compliance_level == RiskLevel.MEDIUM
    ):
        overall_risk = RiskLevel.MEDIUM
    else:
        overall_risk = RiskLevel.LOW

    # 6. Confidence Score Calculation
    base_confidence = float(fusion.get("overall_confidence", 0.88))
    
    # Indeterminate pricing penalty
    if pricing_status == PricingRiskStatus.INDETERMINATE:
        base_confidence = max(0.20, base_confidence - 0.15)
        
    confidence_score = round(min(1.0, max(0.1, base_confidence)), 2)

    risk_assessment = RiskAssessment(
        financial_risk=RiskItem(level=financial_level, rationale=financial_rationale),
        compliance_risk=RiskItem(level=compliance_level, rationale=compliance_rationale),
        contract_risk=RiskItem(level=contract_level, rationale=contract_rationale),
        pricing_risk=PricingRisk(
            status=pricing_status,
            ceiling_price=ceiling_price,
            quoted_price=quoted_price,
            excess_amount=excess_amount
        ),
        overall_risk=overall_risk,
        confidence_score=confidence_score
    )

    state["riskAssessment"] = risk_assessment
    state["risk_assessment"] = risk_assessment
    state["stage"] = "CRITIQUING"

    return state
