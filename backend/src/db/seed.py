"""
Heavy realistic mock dataset generator for AutonoSource procurement cases.
Contains multiple diverse vendor scenarios:
1. BioGen Diagnostics: Clean, Low Risk across all 4 dimensions, Approved.
2. Global Pharma Logistics: High Risk (Pricing Exceeds Ceiling + Temperature Contradiction), Awaiting Approval.
3. Apex BioLogistics: Medium Risk (Clause 2.2.4 Contradiction against WHO TRS 1025, 1.0x Liability Cap), Awaiting Approval.
4. Nova Biologics & Vaccines: Low Risk (Vaccine Schedule M & NPPA compliant), Approved.
5. MediSynth Specialty Formulations: Indeterminate Pricing (Custom API, penalized confidence), Awaiting Approval.
"""

from typing import List
from datetime import datetime, timezone, timedelta
from src.models.schemas import (
    ProcurementItemSummary,
    WorkflowStatus,
    WorkflowStage,
    InvestigationPlan,
    ProcurementReport,
    RankedContext,
    RankedFact,
    RiskAssessment,
    RiskItem,
    RiskLevel,
    PricingRisk,
    PricingRiskStatus,
    ApprovalRecord,
    ApprovalDecision
)

def get_initial_seed_cases() -> List[ProcurementItemSummary]:
    """Returns realistic pre-seeded procurement records for dashboard overview."""
    now = datetime.now(timezone.utc)
    
    return [
        # Case 1: Low Risk (Approved)
        ProcurementItemSummary(
            procurement_id="PR-2026-8801-BIO",
            vendor_name="BioGen Diagnostics Inc.",
            deal_size=450000.0,
            status=WorkflowStatus(
                procurement_id="PR-2026-8801-BIO",
                stage=WorkflowStage.COMPLETE,
                investigation_plan=InvestigationPlan.FULL,
                revision_count=0,
                max_revisions=3,
                failure_reason=None
            ),
            report=ProcurementReport(
                vendor_summary="BioGen Diagnostics is an established supplier of molecular RT-PCR test kits and reagents.",
                financial_assessment="Audited clean with healthy solvency ratio (Credit score: 780). Deal represents 1.8% of annual turnover.",
                compliance_findings="Schedule M GMP and ISO-9001 certified. Valid state manufacturing license verified with CDSCO.",
                flagged_contract_clauses=["Clause 4.1: Liability capped at 1.5x order value with standard mutual indemnity."],
                evidence_summary="Parallel Vector RAG and Graph RAG confirmed valid CDSCO licenses and WHO TRS 1025 cold-chain adherence.",
                fused_context=RankedContext(
                    facts=[
                        RankedFact(
                            fact_id="fact_bg_1",
                            text="Cold chain storage compliant with WHO TRS 1025 standards (2°C to 8°C continuous logging).",
                            source="vector",
                            retriever_score=0.94,
                            source_weight=0.85,
                            final_score=0.799,
                            is_primary=True,
                            contradiction_flag=False,
                            conflicts_with=None
                        ),
                        RankedFact(
                            fact_id="fact_bg_2",
                            text="Graph Node [BioGen]: Valid SLA manufacturing license Form 28-D active through 2028.",
                            source="graph",
                            retriever_score=0.88,
                            source_weight=1.0,
                            final_score=0.880,
                            is_primary=True,
                            contradiction_flag=False,
                            conflicts_with=None
                        )
                    ],
                    overall_confidence=0.89,
                    fallback_to_vector_only=False
                ),
                risk_assessment=RiskAssessment(
                    financial_risk=RiskItem(level=RiskLevel.LOW, rationale="Strong credit rating (780) and zero overdue tax liabilities."),
                    compliance_risk=RiskItem(level=RiskLevel.LOW, rationale="Zero FDA 483 citations, valid CDSCO manufacturing license."),
                    contract_risk=RiskItem(level=RiskLevel.LOW, rationale="Standard pharma MSA terms with balanced 30-day cure period."),
                    pricing_risk=PricingRisk(
                        status=PricingRiskStatus.WITHIN_CEILING,
                        ceiling_price=450000.0,
                        quoted_price=420000.0,
                        excess_amount=0.0
                    ),
                    overall_risk=RiskLevel.LOW,
                    confidence_score=0.89
                ),
                risk_explanation="Low overall risk profile across all four dimensions. Statutory pricing verified within NPPA ceiling.",
                recommendation="PROCEED with procurement. Final purchase order approved."
            ),
            approval=ApprovalRecord(
                decision=ApprovalDecision.APPROVE,
                reason="All 4D risk criteria satisfied and verified within NPPA ceiling.",
                decided_by="Chief Procurement Officer",
                decided_at=(now - timedelta(hours=12)).isoformat()
            ),
            created_at=(now - timedelta(days=2)).isoformat()
        ),

        # Case 2: High Risk (Pricing Exceeds Ceiling + Temperature Discrepancy)
        ProcurementItemSummary(
            procurement_id="PR-2026-9042-GLO",
            vendor_name="Global Pharma Logistics & Formulation Services Ltd.",
            deal_size=580000.0,
            status=WorkflowStatus(
                procurement_id="PR-2026-9042-GLO",
                stage=WorkflowStage.AWAITING_APPROVAL,
                investigation_plan=InvestigationPlan.FULL,
                revision_count=1,
                max_revisions=3,
                failure_reason=None
            ),
            report=ProcurementReport(
                vendor_summary="Global Pharma provides bulk active ingredients and third-party logistics.",
                financial_assessment="Stable financials, credit score 720.",
                compliance_findings="Schedule M GMP compliant. Transit temperature excursion clause flagged.",
                flagged_contract_clauses=["Clause 2.2: 30-minute cumulative temperature excursion threshold."],
                evidence_summary="Fusion engine resolved temperature specification contradiction in favor of Schedule M.",
                fused_context=RankedContext(
                    facts=[
                        RankedFact(
                            fact_id="fact_glo_1",
                            text="WHO TRS 1025 requires strict continuous data logger audit trails.",
                            source="vector",
                            retriever_score=0.91,
                            source_weight=0.85,
                            final_score=0.7735,
                            is_primary=True,
                            contradiction_flag=True,
                            conflicts_with="fact_glo_2"
                        ),
                        RankedFact(
                            fact_id="fact_glo_2",
                            text="Vendor contract proposed manual temperature logging during transit.",
                            source="graph",
                            retriever_score=0.75,
                            source_weight=0.60,
                            final_score=0.450,
                            is_primary=False,
                            contradiction_flag=True,
                            conflicts_with="fact_glo_1"
                        )
                    ],
                    overall_confidence=0.74,
                    fallback_to_vector_only=False
                ),
                risk_assessment=RiskAssessment(
                    financial_risk=RiskItem(level=RiskLevel.LOW, rationale="Audited clean financial records."),
                    compliance_risk=RiskItem(level=RiskLevel.MEDIUM, rationale="Critic detected transit monitoring contradiction."),
                    contract_risk=RiskItem(level=RiskLevel.MEDIUM, rationale="Indemnity cap limited to 1.5x deal value."),
                    pricing_risk=PricingRisk(
                        status=PricingRiskStatus.EXCEEDS_CEILING,
                        ceiling_price=500000.0,
                        quoted_price=580000.0,
                        excess_amount=80000.0
                    ),
                    overall_risk=RiskLevel.HIGH,
                    confidence_score=0.74
                ),
                risk_explanation="Pricing exceeds standard NPPA benchmark by 80,000 INR and transit logging requires escalation.",
                recommendation="EXECUTIVE REVIEW: Quoted deal exceeds statutory ceiling; renegotiate unit rates."
            ),
            approval=None,
            created_at=(now - timedelta(hours=18)).isoformat()
        ),

        # Case 3: Medium Risk (Clause 2.2.4 Contradiction vs WHO TRS 1025)
        ProcurementItemSummary(
            procurement_id="PR-2026-7731-APX",
            vendor_name="Apex BioLogistics & Diagnostic Supplies Pvt. Ltd.",
            deal_size=350000.0,
            status=WorkflowStatus(
                procurement_id="PR-2026-7731-APX",
                stage=WorkflowStage.AWAITING_APPROVAL,
                investigation_plan=InvestigationPlan.FULL,
                revision_count=2,
                max_revisions=3,
                failure_reason=None
            ),
            report=ProcurementReport(
                vendor_summary="Apex BioLogistics supplies RT-PCR molecular reagent packs and refrigerated transport.",
                financial_assessment="Moderate liquidity ratio (Credit score: 680). 2024 commercial transit dispute noted.",
                compliance_findings="Schedule M certified facility. Secondary transit clause permits ambient 15°C to 25°C.",
                flagged_contract_clauses=[
                    "Clause 2.2.4: Permitted 15°C to 25°C ambient transport for regional delivery under 48 hours.",
                    "Clause 4.1: Strict 1.0x liability limitation cap."
                ],
                evidence_summary="Contradiction flagged between SLA Clause 2.2.4 (15°C-25°C) and WHO TRS 1025 (2°C-8°C).",
                fused_context=RankedContext(
                    facts=[
                        RankedFact(
                            fact_id="fact_apx_1",
                            text="WHO TRS 1025 Annex 7: Storage & transit must remain strictly at 2°C to 8°C.",
                            source="vector",
                            retriever_score=0.96,
                            source_weight=0.85,
                            final_score=0.816,
                            is_primary=True,
                            contradiction_flag=True,
                            conflicts_with="fact_apx_2"
                        ),
                        RankedFact(
                            fact_id="fact_apx_2",
                            text="SLA Clause 2.2.4: Ambient passive containers maintaining 15°C to 25°C permitted.",
                            source="graph",
                            retriever_score=0.89,
                            source_weight=0.60,
                            final_score=0.534,
                            is_primary=False,
                            contradiction_flag=True,
                            conflicts_with="fact_apx_1"
                        )
                    ],
                    overall_confidence=0.71,
                    fallback_to_vector_only=False
                ),
                risk_assessment=RiskAssessment(
                    financial_risk=RiskItem(level=RiskLevel.MEDIUM, rationale="Credit score 680 with historical shipping dispute in 2024."),
                    compliance_risk=RiskItem(level=RiskLevel.MEDIUM, rationale="Clause 2.2.4 violates CDSCO cold-chain guidelines for biologics."),
                    contract_risk=RiskItem(level=RiskLevel.MEDIUM, rationale="Liability capped at 1.0x with disclaimer of consequential loss."),
                    pricing_risk=PricingRisk(
                        status=PricingRiskStatus.WITHIN_CEILING,
                        ceiling_price=350000.0,
                        quoted_price=350000.0,
                        excess_amount=0.0
                    ),
                    overall_risk=RiskLevel.MEDIUM,
                    confidence_score=0.71
                ),
                risk_explanation="Medium compliance and contract risk. Reagent integrity at risk if ambient transit clause is accepted.",
                recommendation="CONDITIONAL APPROVAL: Require deletion of Clause 2.2.4 and enforce 2°C to 8°C IoT sensors."
            ),
            approval=None,
            created_at=(now - timedelta(hours=6)).isoformat()
        ),

        # Case 4: Low Risk (Nova Vaccines - Completed & Approved)
        ProcurementItemSummary(
            procurement_id="PR-2026-6102-NOV",
            vendor_name="Nova Biologics & Vaccines India Ltd.",
            deal_size=750000.0,
            status=WorkflowStatus(
                procurement_id="PR-2026-6102-NOV",
                stage=WorkflowStage.COMPLETE,
                investigation_plan=InvestigationPlan.FULL,
                revision_count=0,
                max_revisions=3,
                failure_reason=None
            ),
            report=ProcurementReport(
                vendor_summary="Nova Biologics provides pentavalent pediatric vaccine formulations.",
                financial_assessment="Excellent financial stability, credit score 810.",
                compliance_findings="WHO prequalified facility, zero inspection citations, CDSCO Form 28-D verified.",
                flagged_contract_clauses=["Clause 4: Automatic batch rejection for any excursion beyond 8.5°C."],
                evidence_summary="Full regulatory compliance verified across Schedule M and National Immunization Standards.",
                fused_context=RankedContext(
                    facts=[
                        RankedFact(
                            fact_id="fact_nov_1",
                            text="Contract mandates 100% active IoT sensor tracking on all refrigerated vehicles.",
                            source="vector",
                            retriever_score=0.95,
                            source_weight=0.85,
                            final_score=0.8075,
                            is_primary=True,
                            contradiction_flag=False,
                            conflicts_with=None
                        )
                    ],
                    overall_confidence=0.92,
                    fallback_to_vector_only=False
                ),
                risk_assessment=RiskAssessment(
                    financial_risk=RiskItem(level=RiskLevel.LOW, rationale="Prime tier credit profile."),
                    compliance_risk=RiskItem(level=RiskLevel.LOW, rationale="WHO prequalified and fully Schedule M compliant."),
                    contract_risk=RiskItem(level=RiskLevel.LOW, rationale="Strong buyer-protective indemnity and 2.0x liability cap."),
                    pricing_risk=PricingRisk(
                        status=PricingRiskStatus.WITHIN_CEILING,
                        ceiling_price=750000.0,
                        quoted_price=750000.0,
                        excess_amount=0.0
                    ),
                    overall_risk=RiskLevel.LOW,
                    confidence_score=0.92
                ),
                risk_explanation="Exemplary compliance and cold-chain controls. Quoted at statutory ceiling.",
                recommendation="APPROVE: Low risk vendor with complete compliance pedigree."
            ),
            approval=ApprovalRecord(
                decision=ApprovalDecision.APPROVE,
                reason="Prequalified vendor with verified cold-chain infrastructure.",
                decided_by="Senior Director of Medical Procurement",
                decided_at=(now - timedelta(hours=4)).isoformat()
            ),
            created_at=(now - timedelta(days=1)).isoformat()
        ),

        # Case 5: Indeterminate Pricing (Specialty Oncology Formulation)
        ProcurementItemSummary(
            procurement_id="PR-2026-5540-MED",
            vendor_name="MediSynth Specialty Formulations Ltd.",
            deal_size=220000.0,
            status=WorkflowStatus(
                procurement_id="PR-2026-5540-MED",
                stage=WorkflowStage.AWAITING_APPROVAL,
                investigation_plan=InvestigationPlan.FULL,
                revision_count=1,
                max_revisions=3,
                failure_reason=None
            ),
            report=ProcurementReport(
                vendor_summary="MediSynth provides custom targeted oncology formulation intermediates.",
                financial_assessment="Adequate liquidity, credit score 710.",
                compliance_findings="GMP certified laboratory.",
                flagged_contract_clauses=["Clause 5.1: Specialized custom synthesis non-standard terms."],
                evidence_summary="NPPA database does not contain statutory ceiling price for this proprietary formulation.",
                fused_context=RankedContext(
                    facts=[
                        RankedFact(
                            fact_id="fact_med_1",
                            text="Custom specialty formulation intermediate not indexed in Schedule I DPCO 2013.",
                            source="vector",
                            retriever_score=0.82,
                            source_weight=1.0,
                            final_score=0.820,
                            is_primary=True,
                            contradiction_flag=False,
                            conflicts_with=None
                        )
                    ],
                    overall_confidence=0.68,
                    fallback_to_vector_only=False
                ),
                risk_assessment=RiskAssessment(
                    financial_risk=RiskItem(level=RiskLevel.LOW, rationale="Clean financial audit."),
                    compliance_risk=RiskItem(level=RiskLevel.LOW, rationale="Standard state manufacturing license in good standing."),
                    contract_risk=RiskItem(level=RiskLevel.MEDIUM, rationale="Custom formulation warranty limitations."),
                    pricing_risk=PricingRisk(
                        status=PricingRiskStatus.INDETERMINATE,
                        ceiling_price=None,
                        quoted_price=220000.0,
                        excess_amount=None
                    ),
                    overall_risk=RiskLevel.MEDIUM,
                    confidence_score=0.68
                ),
                risk_explanation="Pricing risk is INDETERMINATE due to lack of statutory ceiling index, reducing overall confidence.",
                recommendation="BENCHMARK AUDIT: Conduct market rate cross-comparison before releasing PO."
            ),
            approval=None,
            created_at=(now - timedelta(hours=3)).isoformat()
        )
    ]
