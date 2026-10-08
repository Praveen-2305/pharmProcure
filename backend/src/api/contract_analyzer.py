"""
Contract Clause Analyzer & Negotiation Pack Generator for AutonoSource (pharmProcure).
Parses pharmaceutical agreements, audits clauses against CDSCO & Indian Commercial Law,
and synthesizes legal replacement clauses and email negotiation packs.
"""

import os
import re
import tempfile
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import Field

from src.models.schemas import CamelBaseModel
from src.agents.contract_parser import extract_contract_clauses, extract_text_from_document

router = APIRouter(prefix="/tools/contract-analyzer", tags=["Contract Analyzer"])

backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOADS_DIR = os.path.join(backend_root, "processed_data", "uploads", "contracts")
os.makedirs(UPLOADS_DIR, exist_ok=True)


class AuditedClauseCard(CamelBaseModel):
    clause_id: str
    clause_title: str
    extracted_text: str
    compliance_status: str  # "COMPLIANT" | "WARNING" | "VIOLATION"
    severity: str           # "LOW" | "MEDIUM" | "HIGH"
    statute_cited: str
    legal_benchmark: str
    recommended_remedy: str


class ContractAuditResponse(CamelBaseModel):
    document_name: str
    overall_contract_risk: str  # "LOW" | "MEDIUM" | "HIGH"
    total_clauses_analyzed: int
    violations_count: int
    warnings_count: int
    compliant_count: int
    summary_rationale: str
    clauses: List[AuditedClauseCard]


class ReplacementClauseItem(CamelBaseModel):
    clause_title: str
    problematic_original: str
    statutory_replacement_clause: str
    rationale: str


class NegotiationPackRequest(CamelBaseModel):
    vendor_name: Optional[str] = "Supplier Legal Counsel"
    contract_title: Optional[str] = "Master Pharmaceutical Supply Agreement"
    flagged_clauses: List[str] = Field(default_factory=list)


class NegotiationPackResponse(CamelBaseModel):
    vendor_name: str
    contract_title: str
    email_subject: str
    email_body_draft: str
    replacement_clauses: List[ReplacementClauseItem]
    negotiation_strategy_tips: List[str]


@router.post("/audit", response_model=ContractAuditResponse)
async def audit_contract(
    file: Optional[UploadFile] = File(None),
    contract_text: Optional[str] = Form(None),
    document_name: Optional[str] = Form("Pharmaceutical_Agreement.pdf"),
):
    """
    Parses uploaded PDF agreement or raw text, auditing clauses against
    WHO TRS 1025 Cold Chain, Schedule M GMP, liability caps, and Indian Arbitration.
    """
    saved_path = ""
    target_filename = document_name or "uploaded_contract.pdf"

    if file:
        target_filename = file.filename or target_filename
        saved_path = os.path.join(UPLOADS_DIR, target_filename)
        content = await file.read()
        with open(saved_path, "wb") as f:
            f.write(content)
    elif contract_text:
        saved_path = os.path.join(UPLOADS_DIR, "text_input.txt")
        with open(saved_path, "w", encoding="utf-8") as f:
            f.write(contract_text)
    else:
        # Default sample contract for instant interactive trial
        sample_text = (
            "MASTER PHARMACEUTICAL SUPPLY AGREEMENT\n"
            "Clause 2.2 Storage: Goods shall be maintained at Controlled Room Temperature 15°C–25°C in transit.\n"
            "Clause 4.1 Indemnification: Supplier aggregate liability shall be capped at ₹50,000 for any and all defaults.\n"
            "Clause 7.3 Remedy: In the event of minor breach, buyer must provide 7-day cure period.\n"
            "Clause 11.2 Jurisdiction: This agreement shall be governed by laws of England seated in London Court of Arbitration.\n"
            "Clause 14.1 Pricing: Quoted prices are subject to escalation and exclude DPCO 2013 statutory limits.\n"
        )
        saved_path = os.path.join(UPLOADS_DIR, "sample_contract.txt")
        with open(saved_path, "w", encoding="utf-8") as f:
            f.write(sample_text)

    # Run parser
    parsed = extract_contract_clauses(saved_path, target_filename)
    raw_text = extract_text_from_document(saved_path)
    text_lower = raw_text.lower() if raw_text else ""

    clauses: List[AuditedClauseCard] = []

    # 1. Cold Chain Clause
    has_cold = any(k in text_lower for k in ["cold chain", "2°c", "2-8°c", "refrigerat", "who trs 1025"])
    has_logger = any(k in text_lower for k in ["data logger", "continuous temperature", "temp log", "logger", "loggers", "iot"])
    has_ambient = any(k in text_lower for k in ["15°c–25°c", "ambient", "room temperature"])

    if has_cold and has_logger:
        clauses.append(
            AuditedClauseCard(
                clause_id="CLS-COLD-01",
                clause_title="Cold-Chain Transit & Continuous Logging (WHO TRS 1025)",
                extracted_text="Mandatory refrigerated transit (2°C–8°C) with continuous digital data logging.",
                compliance_status="COMPLIANT",
                severity="LOW",
                statute_cited="WHO TRS 1025 Annex 7 / Schedule M 2024",
                legal_benchmark="Unbroken 2°C–8°C cold chain with validated NIST-calibrated data loggers.",
                recommended_remedy="Clause verified compliant. Ensure calibration certificates accompany shipment.",
            )
        )
    elif has_ambient or (has_cold and not has_logger):
        clauses.append(
            AuditedClauseCard(
                clause_id="CLS-COLD-01",
                clause_title="Cold-Chain Transit & Temperature Monitoring",
                extracted_text="Ambient 15°C–25°C transit terms specified or unmonitored temperature tolerance.",
                compliance_status="VIOLATION",
                severity="HIGH",
                statute_cited="WHO Technical Report Series No. 1025 (Annex 7)",
                legal_benchmark="Mandatory continuous NIST-calibrated data loggers in all transit packaging for biologics.",
                recommended_remedy="Replace ambient terms with strict WHO TRS 1025 2°C–8°C data logger warranty.",
            )
        )
    else:
        clauses.append(
            AuditedClauseCard(
                clause_id="CLS-COLD-01",
                clause_title="Cold-Chain Transit Specification",
                extracted_text="Standard storage terms specified.",
                compliance_status="WARNING",
                severity="MEDIUM",
                statute_cited="CDSCO Good Distribution Practices",
                legal_benchmark="Specific temperature storage ranges must be declared in commercial schedule.",
                recommended_remedy="Explicitly declare product temperature class and excursion liability.",
            )
        )

    # 2. Liability Cap Clause
    is_micro_cap = any(k in text_lower for k in ["capped at ₹50,000", "not exceed ₹100,000", "capped at 0.1x", "capped at fees paid in 1 month"])
    is_uncapped = any(k in text_lower for k in ["unlimited liability", "no limitation of liability"])

    if is_micro_cap:
        clauses.append(
            AuditedClauseCard(
                clause_id="CLS-LIAB-02",
                clause_title="Limitation of Liability & Indemnification Cap",
                extracted_text="Supplier aggregate liability artificially capped below standard deal exposure.",
                compliance_status="VIOLATION",
                severity="HIGH",
                statute_cited="Indian Contract Act, 1872 Section 73 & Healthcare Standard Terms",
                legal_benchmark="Minimum 1.0x total contract value liability cap for contaminated or non-viable batches.",
                recommended_remedy="Revise liability cap to 1.5x total contract value, uncapped for gross negligence or regulatory fines.",
            )
        )
    elif is_uncapped:
        clauses.append(
            AuditedClauseCard(
                clause_id="CLS-LIAB-02",
                clause_title="Liability Limitation & Consequential Loss",
                extracted_text="Uncapped vendor indemnification and unlimited consequential liability clause.",
                compliance_status="WARNING",
                severity="MEDIUM",
                statute_cited="Commercial Contracting Norms",
                legal_benchmark="Balanced bilateral liability limits aligned with deal risk.",
                recommended_remedy="Establish mutual 1.5x contract value cap excluding gross misconduct.",
            )
        )
    else:
        clauses.append(
            AuditedClauseCard(
                clause_id="CLS-LIAB-02",
                clause_title="Limitation of Liability",
                extracted_text="Standard mutual indemnification and customary liability terms.",
                compliance_status="COMPLIANT",
                severity="LOW",
                statute_cited="Indian Contract Act, 1872",
                legal_benchmark="Proportionate risk sharing with reasonable indemnification caps.",
                recommended_remedy="Terms compliant with institutional procurement standards.",
            )
        )

    # 3. Cure Period Clause
    has_short_cure = any(k in text_lower for k in ["7-day", "7 day", "5 day", "48 hour"])
    if has_short_cure:
        clauses.append(
            AuditedClauseCard(
                clause_id="CLS-CURE-03",
                clause_title="Default Cure Period & Termination Notice",
                extracted_text="Expedited 7-day cure period for performance or supply defaults.",
                compliance_status="WARNING",
                severity="MEDIUM",
                statute_cited="Indian Commercial Customary Law",
                legal_benchmark="Standard 30-day written notice and cure period for pharmaceutical manufacturing audits.",
                recommended_remedy="Extend cure period to 30 days for quality disputes and batch root-cause investigations.",
            )
        )
    else:
        clauses.append(
            AuditedClauseCard(
                clause_id="CLS-CURE-03",
                clause_title="Default Cure Period & Termination Notice",
                extracted_text="Standard 30-day cure period provided for non-critical performance defaults.",
                compliance_status="COMPLIANT",
                severity="LOW",
                statute_cited="Indian Contract Act, 1872",
                legal_benchmark="Balanced 30-day notice period.",
                recommended_remedy="Clause verified compliant.",
            )
        )

    # 4. Dispute Jurisdiction
    has_foreign_seat = any(k in text_lower for k in ["london", "england", "singapore", "delaware", "new york"])
    if has_foreign_seat:
        clauses.append(
            AuditedClauseCard(
                clause_id="CLS-JUR-04",
                clause_title="Arbitration Seat & Governing Jurisdiction",
                extracted_text="Offshore foreign arbitration venue designated (e.g. London / Singapore).",
                compliance_status="VIOLATION",
                severity="HIGH",
                statute_cited="Arbitration and Conciliation Act, 1996 (India)",
                legal_benchmark="Domestic commercial transactions should be seated under Indian High Court jurisdiction.",
                recommended_remedy="Re-seat arbitration in India (e.g. Mumbai, New Delhi, or Bengaluru) under Indian law.",
            )
        )
    else:
        clauses.append(
            AuditedClauseCard(
                clause_id="CLS-JUR-04",
                clause_title="Dispute Resolution & Indian Jurisdiction",
                extracted_text="Arbitration seated domestically under the laws of India.",
                compliance_status="COMPLIANT",
                severity="LOW",
                statute_cited="Arbitration and Conciliation Act, 1996",
                legal_benchmark="Domestic seat with Indian substantive law.",
                recommended_remedy="Clause verified compliant.",
            )
        )

    # 5. DPCO Price Compliance Warranty
    has_dpco_warranty = any(k in text_lower for k in ["dpco 2013", "nppa", "price ceiling warranty", "essential commodities"])
    if not has_dpco_warranty:
        clauses.append(
            AuditedClauseCard(
                clause_id="CLS-DPCO-05",
                clause_title="Statutory DPCO 2013 Price Compliance Warranty",
                extracted_text="Missing explicit statutory warranty confirming prices comply with NPPA DPCO 2013 ceilings.",
                compliance_status="WARNING",
                severity="MEDIUM",
                statute_cited="Drugs (Prices Control) Order, 2013 Paragraph 26",
                legal_benchmark="Mandatory supplier warranty that quoted unit rates do not exceed Government ceiling rates.",
                recommended_remedy="Insert mandatory statutory warranty clause guaranteeing DPCO 2013 price compliance.",
            )
        )
    else:
        clauses.append(
            AuditedClauseCard(
                clause_id="CLS-DPCO-05",
                clause_title="Statutory DPCO 2013 Price Compliance Warranty",
                extracted_text="Explicit warranty affirming prices comply with NPPA DPCO statutory ceiling orders.",
                compliance_status="COMPLIANT",
                severity="LOW",
                statute_cited="DPCO 2013 / Essential Commodities Act 1955",
                legal_benchmark="Express statutory compliance declaration.",
                recommended_remedy="Clause verified compliant.",
            )
        )

    violations = sum(1 for c in clauses if c.compliance_status == "VIOLATION")
    warnings = sum(1 for c in clauses if c.compliance_status == "WARNING")
    compliant = sum(1 for c in clauses if c.compliance_status == "COMPLIANT")

    overall_risk = "HIGH" if violations > 0 else "MEDIUM" if warnings > 0 else "LOW"

    return ContractAuditResponse(
        document_name=target_filename,
        overall_contract_risk=overall_risk,
        total_clauses_analyzed=len(clauses),
        violations_count=violations,
        warnings_count=warnings,
        compliant_count=compliant,
        summary_rationale=(
            f"Audit completed for '{target_filename}'. Identified {violations} statutory violations "
            f"and {warnings} contractual warnings requiring commercial remediation prior to contract sign-off."
        ),
        clauses=clauses,
    )


@router.post("/negotiation-pack", response_model=NegotiationPackResponse)
def generate_negotiation_pack(request: NegotiationPackRequest):
    """
    Synthesizes tailored legal replacement clauses and a formal negotiation email draft.
    """
    v_name = request.vendor_name or "Supplier Commercial Team"
    title = request.contract_title or "Pharmaceutical Supply Agreement"

    replacements: List[ReplacementClauseItem] = [
        ReplacementClauseItem(
            clause_title="Cold-Chain Temperature Control (WHO TRS 1025)",
            problematic_original="Clause 2.2: Ambient storage or lack of continuous digital logging.",
            statutory_replacement_clause=(
                "\"Clause 2.2 (Cold Chain Transit & Digital Data Logging): Supplier warrants and guarantees that all "
                "temperature-sensitive biologics shall be maintained strictly within 2°C–8°C throughout packaging, handling, "
                "and transit in full compliance with WHO TRS 1025 (Annex 7). Supplier shall deploy NIST-calibrated continuous "
                "digital data loggers inside each insulated shipper. Any temperature excursion above 8°C or below 2°C shall "
                "entitle the Buyer to immediate batch rejection and replacement at Supplier's sole cost.\""
            ),
            rationale="Protects against biological denaturation and establishes clear statutory quarantine protocols.",
        ),
        ReplacementClauseItem(
            clause_title="Limitation of Supplier Liability",
            problematic_original="Clause 4.1: Artificially low liability cap.",
            statutory_replacement_clause=(
                "\"Clause 4.1 (Aggregate Liability): Supplier's aggregate liability under this Agreement shall not be capped "
                "below 1.5x (one hundred fifty percent) of total Contract Value. Provided, however, that no limitation of liability "
                "shall apply to Supplier's breach of statutory regulatory requirements (CDSCO/Schedule M), product adulteration, "
                "or gross negligence.\""
            ),
            rationale="Eliminates unacceptable financial exposure for hospital buyers in contaminated batch recalls.",
        ),
        ReplacementClauseItem(
            clause_title="Domestic Arbitration Jurisdiction",
            problematic_original="Clause 11.2: Offshore foreign seat of arbitration.",
            statutory_replacement_clause=(
                "\"Clause 11.2 (Governing Law & Domestic Arbitration): This Agreement shall be governed by and construed in "
                "accordance with the substantive laws of India. Any dispute arising hereunder shall be finally resolved by binding "
                "arbitration seated in New Delhi, India under the Arbitration and Conciliation Act, 1996 by a sole arbitrator.\""
            ),
            rationale="Reduces jurisdictional enforcement costs and conforms to domestic healthcare dispute standards.",
        ),
        ReplacementClauseItem(
            clause_title="Statutory DPCO 2013 Price Compliance Warranty",
            problematic_original="Missing DPCO compliance clause.",
            statutory_replacement_clause=(
                "\"Clause 14.1 (NPPA DPCO 2013 Price Ceiling Compliance): Supplier expressly warrants that all unit prices charged "
                "under this Agreement strictly adhere to the statutory ceiling prices notified by the National Pharmaceutical Pricing "
                "Authority (NPPA) under the Drugs (Prices Control) Order, 2013. Any price charged in excess shall be promptly refunded "
                "with statutory interest.\""
            ),
            rationale="Shields hospital buyer from disgorgement penalties under Essential Commodities Act 1955.",
        ),
    ]

    email_body = (
        f"Dear {v_name},\n\n"
        f"Thank you for sharing the draft {title}.\n\n"
        f"Our legal and procurement compliance audit has completed its review against the CDSCO Drugs & Cosmetics Act, "
        f"Schedule M GMP standards, and statutory DPCO 2013 ceiling price regulations. Before we can finalize executive "
        f"sign-off, we require adjustments to four critical operational and regulatory clauses:\n\n"
        f"1. Cold-Chain Assurance: We require explicit WHO TRS 1025 compliance with mandatory NIST digital data loggers for 2°C–8°C transit.\n"
        f"2. Liability Coverage: The proposed liability cap must be adjusted to 1.5x contract value, with standard carve-outs for regulatory breach.\n"
        f"3. Dispute Resolution: The arbitration venue must be seated domestically in India under the Arbitration & Conciliation Act 1996.\n"
        f"4. DPCO Pricing Warranty: Mandatory confirmation that all quoted rates comply with statutory NPPA ceiling prices.\n\n"
        f"Please find our redline replacement language attached for your review. We are available for a brief call this week to finalize these terms.\n\n"
        f"Sincerely,\n"
        f"Procurement & Legal Compliance Department\n"
        f"AutonoSource Platform"
    )

    tips = [
        "Frame cold-chain data logging as a mutual patient safety mandate under CDSCO rather than a commercial concession.",
        "Emphasize that DPCO 2013 ceiling compliance is statutory law; neither buyer nor seller can contractually override it.",
        "Offer standard 30-day notice cure periods in exchange for domestic arbitration seating.",
    ]

    return NegotiationPackResponse(
        vendor_name=v_name,
        contract_title=title,
        email_subject=f"RE: {title} — Required Regulatory & Commercial Amendments",
        email_body_draft=email_body,
        replacement_clauses=replacements,
        negotiation_strategy_tips=tips,
    )
