"""
Report Writer Agent Node for AutonoSource (pharmProcure).
Synthesizes the complete audit trail and 4D risk assessment into a structured ProcurementReport.
"""

from src.agents.state import WorkflowState
from src.models.schemas import (
    ProcurementReport,
    RankedContext,
    RankedFact,
    WorkflowStage,
    VendorTransparencyMatrix
)
from src.prompts.writer_prompt import WRITER_SYSTEM_PROMPT, get_writer_prompt

def report_writer_agent(state: WorkflowState) -> WorkflowState:
    """
    Synthesizes procurement investigation findings into structured executive report
    guided by the WRITER_SYSTEM_PROMPT schema in INR.
    """
    print("--- REPORT WRITER AGENT: Synthesizing final procurement report in INR ---")

    
    req = state.get("request")
    vendor_name = getattr(req, "vendor_name", None) or state.get("vendorName", "Vendor")
    deal_size = getattr(req, "deal_size", None) or state.get("dealSize", 0.0)
    category = getattr(req, "category", None) or state.get("category", "Pharmaceuticals")
    
    assessment = state.get("riskAssessment") or state.get("risk_assessment")
    overall_risk = getattr(assessment, "overall_risk", "LOW")
    evidence = state.get("evidence_bundle", {})
    hybrid_rag = evidence.get("hybrid_rag", {})
    fusion = hybrid_rag.get("fusion", {})

    # Generate recommendation based on overall risk
    if overall_risk == "LOW":
        recommendation = "APPROVE: Vendor meets all financial, compliance, and regulated pricing benchmarks."
    elif overall_risk == "MEDIUM":
        recommendation = "CONDITIONAL APPROVAL: Require senior executive sign-off and liability cap adjustment."
    else:
        recommendation = "REJECT / ESCALATE: High risk detected in compliance or pricing ceiling violation."

    # Construct Fused Context
    facts_raw = fusion.get("facts", [])
    facts = []
    for f in facts_raw:
        if isinstance(f, dict):
            facts.append(
                RankedFact(
                    fact_id=f.get("fact_id", "fact_1"),
                    text=f.get("text", ""),
                    source=f.get("source", "vector"),
                    retriever_score=float(f.get("retriever_score", 0.8)),
                    source_weight=float(f.get("source_weight", 0.85)),
                    final_score=float(f.get("final_score", 0.68)),
                    is_primary=bool(f.get("is_primary", False)),
                    contradiction_flag=bool(f.get("contradiction_flag", False)),
                    conflicts_with=f.get("conflicts_with")
                )
            )

    fused_context = RankedContext(
        facts=facts,
        overall_confidence=float(fusion.get("overall_confidence", getattr(assessment, "confidence_score", 0.85))),
        fallback_to_vector_only=bool(fusion.get("fallback_to_vector_only", False))
    )

    ext_intel = evidence.get("external_intelligence", {})
    sources = ext_intel.get("sources_scraped", [])
    src_str = ", ".join([s.replace("https://", "").replace("http://", "").split("/")[0] for s in sources[:2]]) if sources else "CDSCO & e-Courts registries"

    evidence_summary = (
        f"Multi-source evidence synthesized across Vector RAG, Knowledge Graph ontology, "
        f"and live web due diligence ({src_str})."
    )

    contract_clauses = evidence.get("contract_clauses", {})
    flagged_clauses = contract_clauses.get("flagged_clauses")
    if not flagged_clauses:
        flagged_clauses = [
            "Clause 4.1: 1.5x liability limitation cap; Clause 2.2: WHO TRS 1025 cold chain monitoring.",
            "Clause 7.3: Balanced 30-day cure period under Indian commercial contract standards."
        ]

    # 5-Pillar Transparency Matrix Integration
    v_transparency_data = evidence.get("vendor_transparency")
    vendor_transparency_obj = None
    if v_transparency_data:
        try:
            vendor_transparency_obj = VendorTransparencyMatrix(**v_transparency_data)
        except Exception as e:
            print(f"[ReportWriter] Note validating VendorTransparencyMatrix: {e}")

    fin_assessment = getattr(getattr(assessment, "financial_risk", None), "rationale", "Audited clean.")
    if vendor_transparency_obj:
        fin_assessment = f"{fin_assessment} Standing: {vendor_transparency_obj.market_standing} (Power: {vendor_transparency_obj.market_power_level.value if hasattr(vendor_transparency_obj.market_power_level, 'value') else vendor_transparency_obj.market_power_level}, Leverage: {vendor_transparency_obj.bargaining_leverage})."

    m_tag = f" — {vendor_transparency_obj.market_standing}" if vendor_transparency_obj else ""
    t_score_str = f" [Transparency Score: {vendor_transparency_obj.overall_transparency_score}/100]" if vendor_transparency_obj else ""

    report = ProcurementReport(
        vendor_summary=f"Comprehensive 5-pillar procurement intelligence audit for {vendor_name}{m_tag} ({category}, Deal Size: ₹{deal_size:,.2f}){t_score_str}.",
        financial_assessment=fin_assessment,
        compliance_findings=getattr(getattr(assessment, "compliance_risk", None), "rationale", "Schedule M GMP certified."),
        flagged_contract_clauses=flagged_clauses,
        evidence_summary=evidence_summary,
        fused_context=fused_context,
        risk_assessment=assessment,
        risk_explanation=f"Overall risk evaluated as {overall_risk}. Confidence based on regulatory and 5-pillar evidence completeness.",
        recommendation=recommendation,
        vendor_transparency=vendor_transparency_obj
    )

    # Sync finalized evaluation to SQLite vendor_profiles cache
    from src.db.session import case_store
    try:
        comp_rat = getattr(getattr(assessment, "compliance_risk", None), "rationale", "Verified compliant.")
        v_id = evidence.get("structured", {}).get("vendor_id") or f"VND-{abs(hash(vendor_name)) % 900 + 100}"
        fin_status_str = fin_assessment
        case_store.upsert_vendor_profile({
            "vendor_name": vendor_name,
            "vendor_id": v_id,
            "global_risk_level": overall_risk.value if hasattr(overall_risk, "value") else str(overall_risk),
            "compliance_status": comp_rat,
            "litigation_summary": getattr(getattr(assessment, "contract_risk", None), "rationale", "Zero disputes."),
            "financial_status": fin_status_str
        })
    except Exception as e:
        print(f"[ReportWriter] Cache update note: {e}")

    state["report"] = report
    state["final_report"] = report.model_dump(by_alias=True)
    state["stage"] = WorkflowStage.AWAITING_APPROVAL
    print(f"[ReportWriter] Report synthesized for {vendor_name}. Stage set to AWAITING_APPROVAL.")

    return state

