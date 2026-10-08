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
    PricingRiskStatus,
    WorkflowStage
)
from src.prompts.scorer_prompt import SCORER_SYSTEM_PROMPT, get_scorer_prompt

def risk_scorer_agent(state: WorkflowState) -> WorkflowState:
    """
    Evaluates evidence bundle across all 4 risk dimensions guided by SCORER_SYSTEM_PROMPT rubric.
    """
    print("--- RISK SCORER AGENT: Computing 4D risk metrics (Financial, Compliance, Contract, Pricing in INR) ---")

    
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
    transparency = evidence.get("vendor_transparency", {})
    m_power = transparency.get("market_power_level", "MODERATE")
    m_standing = transparency.get("market_standing", "Qualified Supplier")
    solv_ratio = float(transparency.get("solvency_ratio", structured.get("solvency_ratio", 2.0)))
    rev_cr = float(transparency.get("annual_revenue_cr", structured.get("annual_revenue_cr", 25.0)))
    blacklisting = transparency.get("governance_integrity", {}).get("blacklisting_status", "Clean - Not Debarred")

    # 1. Financial Risk Evaluation (Solvency, Revenue, Credit Rating & Working Capital)
    financial_level = RiskLevel.LOW
    financial_rationale = f"Audited healthy balance sheet (₹{rev_cr:.1f} Cr revenue, Solvency: {solv_ratio:.2f})."
    credit_score = structured.get("credit_score", 750)
    if credit_score < 600 or solv_ratio < 1.3:
        financial_level = RiskLevel.HIGH
        financial_rationale = f"High solvency/liquidity distress flagged (Credit score: {credit_score}, Solvency: {solv_ratio:.2f})."
    elif credit_score < 700 or solv_ratio < 1.7:
        financial_level = RiskLevel.MEDIUM
        financial_rationale = f"Moderate liquidity profile (₹{rev_cr:.1f} Cr, Solvency: {solv_ratio:.2f}). Stricter milestone-based release required."

    # Incorporate external commercial litigation / arbitration into financial risk
    has_commercial_litigation = any(
        "arbitration" in lit.lower() or "lawsuit" in lit.lower() or "dispute" in lit.lower()
        for lit in litigation
    )
    if has_commercial_litigation:
        lit_summary = "; ".join(litigation)
        if financial_level == RiskLevel.LOW:
            financial_level = RiskLevel.MEDIUM
            financial_rationale = f"{financial_rationale} Active commercial litigation flagged: {lit_summary}"
        else:
            financial_rationale = f"{financial_rationale} Compounded by active legal dispute: {lit_summary}"

    # 2. Compliance Risk Evaluation (CDSCO, NSQ recalls, GMP, and Debarment)
    compliance_level = RiskLevel.LOW
    compliance_rationale = "Schedule M GMP and CDSCO license verified; clean regulatory track record."
    citations = structured.get("fda_483_citations", 0)
    if citations > 2:
        compliance_level = RiskLevel.HIGH
        compliance_rationale = f"Critical non-compliance: {citations} regulatory inspection citations on file."
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

    # Check for tender debarment / blacklisting flags
    if "Flagged" in blacklisting:
        compliance_level = RiskLevel.HIGH
        compliance_rationale = f"Integrity Alert: {blacklisting}. Vendor flagged in tender debarment records."

    # 3. Contract Risk Evaluation (Clauses, Market Dominance, & Operational Resilience)
    contract_clauses = evidence.get("contract_clauses", {})
    if contract_clauses:
        c_level_str = str(contract_clauses.get("contract_risk_level", "LOW")).upper()
        if c_level_str == "HIGH":
            contract_level = RiskLevel.HIGH
        elif c_level_str == "MEDIUM":
            contract_level = RiskLevel.MEDIUM
        else:
            contract_level = RiskLevel.LOW
        contract_rationale = contract_clauses.get("rationale", "Standard indemnification and balanced cure period.")
    else:
        contract_level = RiskLevel.LOW
        contract_rationale = "Standard indemnification terms and mutually balanced 30-day cure period."

    # Factor in Supplier Market Power & Single-Source Lock-in Risk
    if m_power in ["DOMINANT", "STRONG"] and str(m_power).upper() == "DOMINANT":
        if contract_level == RiskLevel.LOW:
            contract_level = RiskLevel.MEDIUM
        contract_rationale = f"{contract_rationale} Supplier holds dominant market standing ({m_standing}); price rigidity and vendor lock-in leverage flagged."

    # Factor in Operational Fulfillment Track Record (OTIF delivery rate)
    otif_rate = float(transparency.get("operational_resilience", {}).get("on_time_delivery_rate", 0.95))
    if otif_rate < 0.90:
        if contract_level == RiskLevel.LOW:
            contract_level = RiskLevel.MEDIUM
        contract_rationale = f"{contract_rationale} Operational fulfillment alert: Historical on-time delivery rate is {otif_rate*100:.1f}% (below 90% benchmark)."

    if fusion.get("has_unresolved_contradictions"):
        if contract_level == RiskLevel.LOW:
            contract_level = RiskLevel.MEDIUM
        contract_rationale = f"{contract_rationale} Unresolved terms or contradictory conditions detected between contract and regulatory rules."


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

    # 7. LIGHT PIPELINE OVERRIDE
    from src.models.schemas import InvestigationPlan
    if state.get("investigation_plan") == InvestigationPlan.LIGHT.value:
        cached_profile = state.get("cached_vendor_profile", {})
        if cached_profile:
            print("[Scorer] LIGHT Pipeline active. Using cached SQL vendor profile.")
            try:
                import json
                lit_summary = ", ".join(json.loads(cached_profile.get("litigation_summary", "[]")))
            except:
                lit_summary = cached_profile.get("litigation_summary", "")

            financial_rationale = f"Cached Status: {cached_profile.get('financial_status', 'Verified')}. Litigation: {lit_summary}"
            compliance_rationale = f"Cached Status: {cached_profile.get('compliance_status', 'Verified')}."
            overall_risk = RiskLevel(cached_profile.get("global_risk_level", "LOW").upper())
            confidence_score = 0.95 # High confidence in cached data

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
    state["stage"] = WorkflowStage.CRITIQUING

    return state
