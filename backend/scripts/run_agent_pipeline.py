"""
CLI Runner for the AutonoSource Multi-Agent Pipeline.
Executes the LangGraph pipeline from terminal and prints step-by-step agent traces.
Usage:
    python scripts/run_agent_pipeline.py --vendor "Apex BioLogistics" --deal 350000 --category "Diagnostic Test Kits"
"""

import sys
import os
import argparse
import json

backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.agents.workflow import create_procurement_workflow
from app.models.schemas import InvestigationPlan, WorkflowStage

def run():
    parser = argparse.ArgumentParser(description="AutonoSource Multi-Agent Pipeline CLI")
    parser.add_argument("--vendor", default="Apex BioLogistics & Diagnostic Supplies Pvt. Ltd.", help="Vendor name")
    parser.add_argument("--deal", type=float, default=350000.0, help="Deal size in currency units")
    parser.add_argument("--category", default="Diagnostic Test Kits", help="Product category")
    parser.add_argument("--details", default="Supply of RT-PCR diagnostic kits with secondary intra-state cold chain distribution.", help="Procurement specifications")
    parser.add_argument("--plan", default="FULL", choices=["LIGHT", "FULL"], help="Pre-selected investigation plan")

    args = parser.parse_args()

    print("=" * 70)
    print("AUTONOSOURCE: Autonomous Multi-Agent Procurement Audit")
    print(f"Vendor:   {args.vendor}")
    print(f"Deal:     ${args.deal:,.2f}")
    print(f"Category: {args.category}")
    print("=" * 70 + "\n")

    initial_state = {
        "procurementId": "CLI-TEST-001",
        "vendorName": args.vendor,
        "dealSize": args.deal,
        "category": args.category,
        "procurementDetails": args.details,
        "investigationPlan": InvestigationPlan(args.plan),
        "stage": WorkflowStage.PLANNING,
        "revisionCount": 0,
        "maxRevisions": 3,
        "evidence_bundle": {}
    }

    workflow = create_procurement_workflow()
    print("[Pipeline Engine] Invoking LangGraph state graph...\n")
    final_state = workflow.invoke(initial_state)

    print("\n" + "=" * 70)
    print("WORKFLOW AUDIT COMPLETED")
    print(f"Final Stage: {final_state.get('stage')}")
    print(f"Revisions Executed: {final_state.get('revisionCount')} of 3")
    
    report = final_state.get("report")
    if report:
        print("\n--- 4D RISK BREAKDOWN ---")
        risk = report.risk_assessment
        print(f"  Financial Risk:  {risk.financial_risk.level.value:<8} | {risk.financial_risk.rationale}")
        print(f"  Compliance Risk: {risk.compliance_risk.level.value:<8} | {risk.compliance_risk.rationale}")
        print(f"  Contract Risk:   {risk.contract_risk.level.value:<8} | {risk.contract_risk.rationale}")
        print(f"  Pricing Risk:    {risk.pricing_risk.status.value:<8} | Quoted: ${risk.pricing_risk.quoted_price:,.2f} (Ceiling: {risk.pricing_risk.ceiling_price})")
        print(f"  OVERALL RISK:    {risk.overall_risk.value}")
        print(f"  CONFIDENCE:      {risk.confidence_score:.2f}")

        print("\n--- ACTIONABLE RECOMMENDATION ---")
        print(f"  {report.recommendation}")
    print("=" * 70)

if __name__ == "__main__":
    run()
