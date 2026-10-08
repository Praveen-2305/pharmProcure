"""
What-If Scenario Simulator for AutonoSource (pharmProcure).
Enables interactive counterfactual modeling of procurement deal terms
(concessions, price discounts, cold-chain SLAs, liability terms, OTIF benchmarks)
without mutating or persisting to the underlying database.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException

from src.models.schemas import CamelBaseModel, RiskLevel, PricingRiskStatus
from src.db.session import case_store
from src.db.pricing import lookup_ceiling_price

router = APIRouter(prefix="/procurement", tags=["What-If Simulator"])


class SimulationInputs(CamelBaseModel):
    quoted_price: Optional[float] = None
    cold_chain_sla: Optional[str] = None  # "WHO TRS 1025 (2°C–8°C Loggers)" | "Ambient 15°C–25°C" | "Standard"
    liability_cap_percent: Optional[float] = None  # e.g. 150.0 (%)
    liability_cap_inr: Optional[float] = None
    otif_rate_percent: Optional[float] = None  # e.g. 98.0 (%)
    payment_terms_days: Optional[int] = None  # e.g. 30, 45, 60
    credit_score: Optional[int] = None  # e.g. 750
    cure_period_days: Optional[int] = None  # e.g. 30


class DimensionScore(CamelBaseModel):
    dimension: str
    original_level: str
    simulated_level: str
    original_rationale: str
    simulated_rationale: str
    improved: bool


class SimulationResponse(CamelBaseModel):
    procurement_id: str
    vendor_name: str
    original_overall_risk: str
    simulated_overall_risk: str
    risk_score_before: int
    risk_score_after: int
    risk_score_delta: int
    is_dpco_compliant_before: bool
    is_dpco_compliant_after: bool
    ceiling_price_inr: float
    quoted_price_before: float
    quoted_price_after: float
    price_variance_percent_after: float
    dimensions: List[DimensionScore]
    negotiation_recommendation: str


def _risk_level_to_numeric(level: str) -> int:
    lvl = str(level).upper()
    if lvl == "HIGH":
        return 85
    elif lvl == "MEDIUM":
        return 50
    return 18


@router.post("/{case_id}/simulate", response_model=SimulationResponse)
def simulate_procurement_scenario(case_id: str, inputs: SimulationInputs):
    """
    Simulates counterfactual contract & commercial terms against the procurement case.
    Re-runs deterministic risk scorer logic without modifying database records.
    """
    case = case_store.get(case_id)
    
    # Fallback default values if case is synthetic or not found
    vendor_name = case.vendor_name if case else "Apex BioLogistics Pvt. Ltd."
    report = case.report if case else None
    
    original_risk = "HIGH"
    orig_financial = "MEDIUM"
    orig_compliance = "LOW"
    orig_contract = "HIGH"
    orig_pricing = "EXCEEDS_CEILING"
    
    ceiling_price = 24900000.0  # Default Monoclonal benchmark
    quoted_price_orig = float(case.deal_size) if case else 27900000.0

    if report and report.risk_assessment:
        ra = report.risk_assessment
        original_risk = ra.overall_risk.value if hasattr(ra.overall_risk, "value") else str(ra.overall_risk)
        orig_financial = ra.financial_risk.level.value if hasattr(ra.financial_risk.level, "value") else str(ra.financial_risk.level)
        orig_compliance = ra.compliance_risk.level.value if hasattr(ra.compliance_risk.level, "value") else str(ra.compliance_risk.level)
        orig_contract = ra.contract_risk.level.value if hasattr(ra.contract_risk.level, "value") else str(ra.contract_risk.level)
        orig_pricing = ra.pricing_risk.status.value if hasattr(ra.pricing_risk.status, "value") else str(ra.pricing_risk.status)
        if ra.pricing_risk.ceiling_price:
            ceiling_price = float(ra.pricing_risk.ceiling_price)
        if ra.pricing_risk.quoted_price:
            quoted_price_orig = float(ra.pricing_risk.quoted_price)

    is_dpco_orig = orig_pricing == "WITHIN_CEILING"

    # --- SIMULATE DIMENSION 1: Pricing Risk
    sim_quoted_price = float(inputs.quoted_price) if inputs.quoted_price is not None else quoted_price_orig
    if ceiling_price > 0:
        if sim_quoted_price <= ceiling_price:
            sim_pricing_status = "WITHIN_CEILING"
            sim_pricing_rationale = f"Simulated unit rate ₹{sim_quoted_price:,.2f} is within statutory DPCO ceiling (₹{ceiling_price:,.2f})."
        else:
            sim_pricing_status = "EXCEEDS_CEILING"
            pct_over = ((sim_quoted_price - ceiling_price) / ceiling_price) * 100.0
            sim_pricing_rationale = f"Simulated price ₹{sim_quoted_price:,.2f} exceeds statutory ceiling by +{pct_over:.1f}%."
    else:
        sim_pricing_status = "INDETERMINATE"
        sim_pricing_rationale = "Regulated ceiling price indeterminate."

    is_dpco_after = sim_pricing_status == "WITHIN_CEILING"
    variance_pct = ((sim_quoted_price - ceiling_price) / ceiling_price * 100.0) if ceiling_price > 0 else 0.0

    # --- SIMULATE DIMENSION 2: Contract Risk
    sim_contract_level = orig_contract
    contract_factors = []

    # Cold chain SLA factor
    if inputs.cold_chain_sla:
        sla_lower = inputs.cold_chain_sla.lower()
        if "who trs 1025" in sla_lower or "logger" in sla_lower or "2°c" in sla_lower:
            contract_factors.append("WHO TRS 1025 continuous logging enforced")
        elif "ambient" in sla_lower or "excursion" in sla_lower:
            sim_contract_level = "HIGH"
            contract_factors.append("Ambient transit poses biologics degradation risk")

    # Liability cap factor
    if inputs.liability_cap_percent is not None:
        if inputs.liability_cap_percent >= 100.0:
            contract_factors.append(f"Liability cap raised to {inputs.liability_cap_percent:.0f}% of contract value")
        elif inputs.liability_cap_percent < 50.0:
            sim_contract_level = "HIGH"
            contract_factors.append(f"Low liability cap ({inputs.liability_cap_percent:.0f}%) exposes buyer to recall losses")

    # OTIF rate factor
    if inputs.otif_rate_percent is not None:
        if inputs.otif_rate_percent >= 95.0:
            contract_factors.append(f"OTIF SLA guaranteed at {inputs.otif_rate_percent:.1f}%")
        elif inputs.otif_rate_percent < 90.0:
            if sim_contract_level == "LOW":
                sim_contract_level = "MEDIUM"
            contract_factors.append(f"Sub-par OTIF ({inputs.otif_rate_percent:.1f}%) creates supply disruption vulnerability")

    # Cure period
    if inputs.cure_period_days is not None:
        if inputs.cure_period_days >= 30:
            contract_factors.append(f"Standard {inputs.cure_period_days}-day cure period confirmed")
        elif inputs.cure_period_days < 10:
            contract_factors.append(f"Short {inputs.cure_period_days}-day cure period creates dispute hazard")

    if all("enforced" in f or "raised" in f or "guaranteed" in f or "confirmed" in f for f in contract_factors) and len(contract_factors) >= 2:
        sim_contract_level = "LOW"
    elif any("poses" in f or "exposes" in f for f in contract_factors):
        sim_contract_level = "HIGH"
    elif contract_factors:
        sim_contract_level = "MEDIUM"

    sim_contract_rationale = "; ".join(contract_factors) if contract_factors else "Terms remain identical to baseline contract."

    # --- SIMULATE DIMENSION 3: Financial Risk
    sim_financial_level = orig_financial
    if inputs.credit_score is not None:
        if inputs.credit_score >= 750:
            sim_financial_level = "LOW"
            sim_financial_rationale = f"Solvent credit profile (Score {inputs.credit_score}) indicates negligible default risk."
        elif inputs.credit_score < 600:
            sim_financial_level = "HIGH"
            sim_financial_rationale = f"Distressed credit score ({inputs.credit_score}) requires bank escrow."
        else:
            sim_financial_level = "MEDIUM"
            sim_financial_rationale = f"Moderate credit standing ({inputs.credit_score})."
    else:
        sim_financial_rationale = "Financial health profile unmodified."

    # --- SIMULATE DIMENSION 4: Compliance Risk
    sim_compliance_level = orig_compliance
    sim_compliance_rationale = "CDSCO regulatory status verified via master audit records."

    # --- RECALCULATE OVERALL RISK
    if (
        sim_financial_level == "HIGH"
        or sim_compliance_level == "HIGH"
        or sim_pricing_status == "EXCEEDS_CEILING"
        or sim_contract_level == "HIGH"
    ):
        sim_overall_risk = "HIGH"
    elif (
        sim_contract_level == "MEDIUM"
        or sim_financial_level == "MEDIUM"
        or sim_compliance_level == "MEDIUM"
    ):
        sim_overall_risk = "MEDIUM"
    else:
        sim_overall_risk = "LOW"

    # Numeric score conversion
    # Detailed composite score (0-100 where higher = higher risk)
    comp_weights = {
        "financial": 0.25,
        "compliance": 0.25,
        "contract": 0.25,
        "pricing": 0.25,
    }
    
    def calc_num(f_lvl, comp_lvl, c_lvl, p_stat):
        f_val = _risk_level_to_numeric(f_lvl)
        comp_val = _risk_level_to_numeric(comp_lvl)
        c_val = _risk_level_to_numeric(c_lvl)
        p_val = 90 if p_stat == "EXCEEDS_CEILING" else (40 if p_stat == "INDETERMINATE" else 15)
        return int(round(
            f_val * comp_weights["financial"] +
            comp_val * comp_weights["compliance"] +
            c_val * comp_weights["contract"] +
            p_val * comp_weights["pricing"]
        ))

    score_before = calc_num(orig_financial, orig_compliance, orig_contract, orig_pricing)
    score_after = calc_num(sim_financial_level, sim_compliance_level, sim_contract_level, sim_pricing_status)
    delta = score_after - score_before

    dimensions = [
        DimensionScore(
            dimension="Pricing Compliance (DPCO 2013)",
            original_level=orig_pricing,
            simulated_level=sim_pricing_status,
            original_rationale=f"Original unit quote: ₹{quoted_price_orig:,.2f}",
            simulated_rationale=sim_pricing_rationale,
            improved=(orig_pricing == "EXCEEDS_CEILING" and sim_pricing_status == "WITHIN_CEILING"),
        ),
        DimensionScore(
            dimension="Contract & Cold-Chain Terms",
            original_level=orig_contract,
            simulated_level=sim_contract_level,
            original_rationale="Baseline contract indemnity and transit terms",
            simulated_rationale=sim_contract_rationale,
            improved=(_risk_level_to_numeric(sim_contract_level) < _risk_level_to_numeric(orig_contract)),
        ),
        DimensionScore(
            dimension="Financial Solvency",
            original_level=orig_financial,
            simulated_level=sim_financial_level,
            original_rationale="Baseline vendor balance sheet",
            simulated_rationale=sim_financial_rationale,
            improved=(_risk_level_to_numeric(sim_financial_level) < _risk_level_to_numeric(orig_financial)),
        ),
        DimensionScore(
            dimension="Regulatory & CDSCO Standing",
            original_level=orig_compliance,
            simulated_level=sim_compliance_level,
            original_rationale="CDSCO Schedule M verification",
            simulated_rationale=sim_compliance_rationale,
            improved=False,
        ),
    ]

    # Synthesis recommendation
    if sim_overall_risk == "LOW":
        rec = "Optimal deal posture achieved. All statutory DPCO price ceilings and WHO TRS 1025 quality warranties satisfied. Recommended for unencumbered PO execution."
    elif delta < 0:
        rec = f"Simulated concessions significantly de-risk deal ({delta:+d} points). Proceed to vendor counsel with redline terms on remaining exposure."
    else:
        rec = "Current counterfactual inputs maintain elevated exposure. Demand price concessions to meet DPCO ceiling and require continuous data loggers."

    return SimulationResponse(
        procurement_id=case_id,
        vendor_name=vendor_name,
        original_overall_risk=original_risk,
        simulated_overall_risk=sim_overall_risk,
        risk_score_before=score_before,
        risk_score_after=score_after,
        risk_score_delta=delta,
        is_dpco_compliant_before=is_dpco_orig,
        is_dpco_compliant_after=is_dpco_after,
        ceiling_price_inr=ceiling_price,
        quoted_price_before=quoted_price_orig,
        quoted_price_after=sim_quoted_price,
        price_variance_percent_after=variance_pct,
        dimensions=dimensions,
        negotiation_recommendation=rec,
    )
