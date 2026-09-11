# AutonoSource (pharmProcure) — Backend Agent Implementation Guide

**Purpose:** The Backend Specification document defines *what* each agent must do and the API/schema contract. This document goes one level deeper — actual code skeletons for each agent node, the LangGraph wiring, workflow state, and seed data — so implementation isn't left to interpretation.

---

## 1. Workflow State (`app/agents/state.py`)

Every agent reads from and writes to a single shared state object. Define it explicitly rather than passing loose dicts between nodes:

```python
from typing import TypedDict, Optional
from app.models.schemas import (
    InvestigationPlan, WorkflowStage, RankedContext,
    RiskAssessment, ProcurementReport
)

class WorkflowState(TypedDict, total=False):
    procurementId: str
    vendorName: str
    dealSize: float
    procurementDetails: str
    contractDocumentPath: Optional[str]

    investigationPlan: InvestigationPlan
    stage: WorkflowStage
    revisionCount: int
    maxRevisions: int

    fusedContext: Optional[RankedContext]      # output of Executor (via fusion.py)
    riskAssessment: Optional[RiskAssessment]   # output of Risk Scorer
    criticFeedback: Optional[str]              # what the Critic wants re-investigated
    report: Optional[ProcurementReport]        # output of Report Writer

    failureReason: Optional[str]
```

Keep this flat — resist nesting sub-states per agent. A flat shared state is what makes the LangGraph conditional edges (Section 6) simple to write; deeply nested state makes every node need to know another node's internal structure.

---

## 2. Planner (`app/agents/planner.py`)

```python
def plan_investigation(state: WorkflowState) -> WorkflowState:
    """
    Cheap, rule-based signal check — this must NOT make an LLM call for
    every submission. Only escalate to FULL when signals actually warrant it.
    """
    deal_size = state["dealSize"]
    vendor_name = state["vendorName"]
    is_known_vendor = check_vendor_history(vendor_name)  # DB lookup, not LLM

    # If the user pre-selected a plan on the frontend, respect it unless
    # deal size is high enough to force FULL regardless.
    user_selected = state.get("investigationPlan")

    if deal_size > 500_000 or not is_known_vendor:
        plan = InvestigationPlan.FULL
    elif user_selected == InvestigationPlan.FULL:
        plan = InvestigationPlan.FULL
    else:
        plan = InvestigationPlan.LIGHT

    state["investigationPlan"] = plan
    state["stage"] = WorkflowStage.EXECUTING
    state["revisionCount"] = 0
    state["maxRevisions"] = 3
    return state
```

**Design note:** the threshold values (`$500,000`, "unknown vendor forces FULL") are placeholders — tune them against your actual seed vendor dataset once it exists, and record whatever thresholds you land on in the Test & Validation Plan's dataset design, since the Planner's decision accuracy is one of the metrics that plan requires you to measure against hand-labeled expectations.

---

## 3. Executor (`app/agents/executor.py`)

This node's entire job is to call the RAG subsystem and structured lookups, then hand off to fusion. It should contain **no scoring logic** — that belongs to the Risk Scorer.

```python
from app.rag.vector_retriever import query_vector_index
from app.rag.graph_retriever import query_graph_index
from app.rag.fusion import fuse_retrieval_results
from app.db.pricing import lookup_ceiling_price

SOURCE_PRIORITY = {
    "drugs_and_cosmetics_act.pdf": 1.0,
    "schedule_m_gmp.pdf": 1.0,
    "who_trs_1025_annex7.pdf": 0.85,
    "gdp_guidelines.pdf": 0.85,
    "stakeholder_notification.pdf": 0.6,
}

async def execute_evidence_gathering(state: WorkflowState) -> WorkflowState:
    query = build_query_from_context(
        state["vendorName"], state["procurementDetails"],
        feedback=state.get("criticFeedback"),   # widen query on revision loops
    )

    vector_hits = await query_vector_index(query, top_k=8)
    graph_hits = await query_graph_index(query, max_hops=2)

    fused = fuse_retrieval_results(
        vector_results=vector_hits,
        graph_results=graph_hits,
        source_priority=SOURCE_PRIORITY,
    )

    # Structured lookups happen in parallel with RAG, not sequentially after it
    vendor_record = get_vendor_record(state["vendorName"])
    ceiling_price = lookup_ceiling_price(product_category=vendor_record.category)

    state["fusedContext"] = fused
    state["vendorRecord"] = vendor_record       # pass through for the scorer
    state["ceilingPrice"] = ceiling_price
    state["stage"] = WorkflowStage.SCORING
    return state
```

**On revision loops:** note `feedback=state.get("criticFeedback")` — when the Critic sends the workflow back here, the query must actually change (broaden search terms, target the specific gap the Critic identified) or you'll fetch the identical evidence and loop pointlessly until `maxRevisions` is hit. This is a common and easy-to-miss bug: implement `build_query_from_context` so it genuinely incorporates feedback, and write a test case for it.

---

## 4. Risk Scorer (`app/agents/scorer.py`)

```python
def score_risk(state: WorkflowState) -> WorkflowState:
    fused = state["fusedContext"]
    vendor = state["vendorRecord"]

    financial = assess_financial_risk(vendor, state["dealSize"])
    compliance = assess_compliance_risk(fused.facts)   # reads GMP/GDP facts from fusion
    contract = assess_contract_risk(state.get("contractDocumentPath"))
    pricing = assess_pricing_risk(
        quoted_price=vendor.quotedPrice,
        ceiling_price=state.get("ceilingPrice"),
    )

    overall = max(financial.level, compliance.level, contract.level,
                  pricing_risk_to_level(pricing), key=risk_severity_order)

    # Confidence is reduced by BOTH unresolved fusion contradictions
    # AND an indeterminate pricing result — never just one or the other.
    confidence = fused.overallConfidence
    if pricing.status == PricingRiskStatus.INDETERMINATE:
        confidence *= 0.85

    state["riskAssessment"] = RiskAssessment(
        financialRisk=financial, complianceRisk=compliance,
        contractRisk=contract, pricingRisk=pricing,
        overallRisk=overall, confidenceScore=confidence,
    )
    state["stage"] = WorkflowStage.CRITIQUING
    return state


def assess_pricing_risk(quoted_price: float, ceiling_price: Optional[float]) -> PricingRisk:
    """Deterministic lookup — no LLM call here. See Backend Specification Section 6."""
    if ceiling_price is None:
        return PricingRisk(status=PricingRiskStatus.INDETERMINATE,
                            quotedPrice=quoted_price)
    if quoted_price > ceiling_price:
        return PricingRisk(status=PricingRiskStatus.EXCEEDS_CEILING,
                            ceilingPrice=ceiling_price, quotedPrice=quoted_price,
                            excessAmount=quoted_price - ceiling_price)
    return PricingRisk(status=PricingRiskStatus.WITHIN_CEILING,
                        ceilingPrice=ceiling_price, quotedPrice=quoted_price)
```

---

## 5. Critic (`app/agents/critic.py`)

```python
CONFIDENCE_THRESHOLD = 0.75

def critique_assessment(state: WorkflowState) -> WorkflowState:
    risk = state["riskAssessment"]
    fused = state["fusedContext"]

    unresolved_contradictions = [f for f in fused.facts if f.contradictionFlag]
    confidence_ok = risk.confidenceScore >= CONFIDENCE_THRESHOLD
    no_unresolved_conflicts = len(unresolved_contradictions) == 0

    if confidence_ok and no_unresolved_conflicts:
        state["stage"] = WorkflowStage.WRITING_REPORT
        return state

    if state["revisionCount"] >= state["maxRevisions"]:
        # Exhausted revisions — proceed anyway, but the report must say so.
        state["criticFeedback"] = (
            "Maximum revisions reached with residual uncertainty; "
            "proceeding with best-available evidence."
        )
        state["stage"] = WorkflowStage.WRITING_REPORT
        return state

    # Genuinely loop back — describe WHAT to re-investigate, not just "insufficient"
    gaps = []
    if not confidence_ok:
        gaps.append(f"confidence {risk.confidenceScore:.2f} below threshold {CONFIDENCE_THRESHOLD}")
    if unresolved_contradictions:
        gaps.append(f"{len(unresolved_contradictions)} unresolved contradiction(s)")

    state["criticFeedback"] = "; ".join(gaps)
    state["revisionCount"] += 1
    state["stage"] = WorkflowStage.EXECUTING
    return state
```

**This is the node that most directly implements the "confidence below threshold OR unresolved conflict" escalation logic** central to the whole system — the `confidence_ok and no_unresolved_conflicts` check is that rule as code. Keep both conditions explicit and separately testable; don't collapse them into a single opaque score.

---

## 6. Report Writer (`app/agents/writer.py`)

```python
def write_report(state: WorkflowState) -> WorkflowState:
    risk = state["riskAssessment"]
    fused = state["fusedContext"]

    report = ProcurementReport(
        vendorSummary=summarize_vendor(state["vendorRecord"]),
        financialAssessment=risk.financialRisk.rationale,
        complianceFindings=risk.complianceRisk.rationale,
        flaggedContractClauses=extract_flagged_clauses(state.get("contractDocumentPath")),
        evidenceSummary=summarize_evidence(fused),
        fusedContext=fused,
        riskAssessment=risk,
        riskExplanation=build_risk_explanation(risk, fused),
        recommendation=derive_recommendation(risk),
    )

    state["report"] = report
    state["stage"] = WorkflowStage.AWAITING_APPROVAL
    return state
```

`build_risk_explanation` should explicitly mention any residual contradiction or indeterminate pricing carried through from the Critic — this is what makes the human-approval stage meaningful rather than a rubber stamp; the officer needs to see what's uncertain, not just a clean final number.

---

## 7. LangGraph Wiring (`app/agents/workflow.py`)

```python
from langgraph.graph import StateGraph, END
from app.agents.state import WorkflowState
from app.agents import planner, executor, scorer, critic, writer

def build_workflow_graph():
    graph = StateGraph(WorkflowState)

    graph.add_node("planning", planner.plan_investigation)
    graph.add_node("executing", executor.execute_evidence_gathering)
    graph.add_node("scoring", scorer.score_risk)
    graph.add_node("critiquing", critic.critique_assessment)
    graph.add_node("writing_report", writer.write_report)

    graph.set_entry_point("planning")
    graph.add_edge("planning", "executing")
    graph.add_edge("executing", "scoring")
    graph.add_edge("scoring", "critiquing")

    graph.add_conditional_edges(
        "critiquing",
        lambda state: "writing_report" if state["stage"] == WorkflowStage.WRITING_REPORT else "executing",
        {"writing_report": "writing_report", "executing": "executing"},
    )
    graph.add_edge("writing_report", END)

    return graph.compile()
```

`AWAITING_APPROVAL` and `COMPLETE` are handled **outside** the LangGraph itself — they're driven by the `/approval/{id}/decide` endpoint, not a graph node, since they depend on external human input arriving asynchronously, not on internal state transitions. When `REQUEST_MORE_INFO` is received, re-invoke the compiled graph starting from the `executing` node with `criticFeedback` populated from the reviewer's reason.

---

## 8. Seed Data (`app/db/seed.py`)

Two things need seeding: **procurement cases** (so the dashboard isn't empty) and the **pricing reference dataset** (so the pricing check has something to look up against).

```python
SEED_VENDORS = [
    {
        "vendorName": "BioGen Diagnostics Inc.",
        "dealSize": 450_000,
        "productCategory": "diagnostic_reagents",
        "quotedPrice": 12_500,
        "status": WorkflowStage.COMPLETE,
        "overallRisk": RiskLevel.LOW,
    },
    {
        "vendorName": "MediSupply Global Logistics",
        "dealSize": 890_000,
        "productCategory": "cold_chain_biologics",
        "quotedPrice": 340_000,
        "status": WorkflowStage.COMPLETE,
        "overallRisk": RiskLevel.HIGH,
    },
]

# Keyed by product category — this is what makes pricing risk deterministic.
# Seed at least one category deliberately absent to test INDETERMINATE.
SEED_PRICING_REFERENCE = {
    "diagnostic_reagents": {"ceiling_price": 13_000, "source": "NPPA compendium (example)"},
    "cold_chain_biologics": {"ceiling_price": 300_000, "source": "DPCO schedule (example)"},
    # "novel_therapeutics" deliberately absent -> tests INDETERMINATE path
}

def seed_database(session):
    if session.query(ProcurementCase).count() > 0:
        return  # idempotent — don't reseed on every restart
    for vendor in SEED_VENDORS:
        session.add(ProcurementCase(**vendor))
    session.commit()
```

**Note:** these numbers are illustrative placeholders for development, not real regulatory figures — mark them as such in code comments so nobody mistakes seed data for actual DPCO/NPPA prices later.

---

## 9. What this document does not cover

- Database table definitions / SQLModel classes — straightforward CRUD, not worth detailing here; follow the `ProcurementItemSummary` and `WorkflowStatus` schemas as the source of truth for what columns are needed.
- Deployment/Docker/environment configuration — a separate concern from agent logic; write this once the local dev flow is confirmed working end-to-end.
- The fusion algorithm itself — already fully specified with required unit tests in the Backend Specification (Section 5.3) and the Test & Validation Plan.
