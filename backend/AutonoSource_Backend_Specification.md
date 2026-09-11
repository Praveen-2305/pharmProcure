# AutonoSource (pharmProcure) — Backend Build Specification

**Purpose of this document:** This is the complete technical specification for the FastAPI backend of AutonoSource. It is written to be handed directly to Antigravity (or any coding agent) to build the backend against an **already-built, unmodifiable React/Vite/TypeScript frontend**. Every schema, endpoint, and workflow stage below is derived from the actual frontend code and must be matched exactly — this document is the contract, not a suggestion.

---

## 1. System Overview

AutonoSource is an autonomous multi-agent AI procurement governance and audit engine for the pharmaceutical and life-sciences sector. It ingests vendor proposals and optional contract documents, retrieves and reconciles evidence from regulatory sources, computes a four-dimensional risk assessment, and produces an auditable casefile for a human procurement officer to approve, reject, or send back for more investigation.

The system is **not** a single-prompt LLM wrapper. It is a stateful multi-agent workflow with a bounded revision loop and a mandatory human-approval gate — no procurement decision is ever finalized autonomously.

---

## 2. Frontend Contract (source of truth — do not deviate)

The frontend is already built and running against `http://localhost:8000`. Before writing any backend code, read these files in full and treat them as binding:

- `frontend/src/api/types.ts` — every backend Pydantic model must serialize to JSON matching these TypeScript interfaces **field-for-field**, including exact casing (camelCase, not snake_case).
- `frontend/src/api/procurement.ts`, `frontend/src/api/approval.ts` — exact endpoints, HTTP methods, and payload shapes.
- `frontend/src/hooks/useProcurementStatus.ts` — confirms the frontend polls `GET /procurement/{id}/status` every 1.5 seconds. This endpoint must be cheap (no heavy computation, no LLM calls) since it's hit constantly.
- `backend/rag_storage/` — regulatory PDFs already present, organized as:
  - `drug_regulations/` — Drugs & Cosmetics Act 1940 & Rules 1945, Good Distribution Practices (GDP)
  - `drugs/` — State/UT licensing authority directories, counterfeit alerts, stakeholder notifications
  - `gmp/` — Schedule M (Good Manufacturing Practices)
  - `storage/` — WHO TRS 1025 Annex 7 (temperature-sensitive product storage/distribution)

Do not invent new source documents or restructure this folder — ingest what's already there.

---

## 3. Multi-Agent Workflow (authoritative — matches FIG. 1 and FIG. 3 of the patent drawings)

```
PROCUREMENT REQUEST
        │
        ▼
   PLANNING           — determine investigation depth (LIGHT / FULL)
        │
        ▼
   EXECUTING  ◄────────────────┐
        │                      │  (loop back if evidence insufficient
        ▼                      │   AND revisionCount < maxRevisions)
   SCORING                     │
        │                      │
        ▼                      │
   CRITIQUING ──────────────────┘
        │
        ▼
   WRITING_REPORT
        │
        ▼
   AWAITING_APPROVAL ──(human decision)──► COMPLETE
```

### Stage definitions

| Stage | Responsible module | What happens |
|---|---|---|
| `PLANNING` | `agents/planner.py` | Evaluates `dealSize`, `vendorName`, `procurementDetails` (and `investigationPlan` if pre-selected). Sets scope for evidence gathering. |
| `EXECUTING` | `agents/executor.py` | Dual-path evidence gathering — see Section 5 (RAG subsystem) in full. |
| `SCORING` | `agents/scorer.py` | Computes four risk dimensions — see Section 6. |
| `CRITIQUING` | `agents/critic.py` | Checks for unresolved contradictions (from fusion output) and confidence below threshold. Either condition alone triggers a loop back to `EXECUTING`, incrementing `revisionCount`, up to `maxRevisions = 3`. |
| `WRITING_REPORT` | `agents/writer.py` | Synthesizes the final `ProcurementReport` from all upstream agent outputs. |
| `AWAITING_APPROVAL` | `routers/approval.py` | Human-in-the-loop pause. Case appears in the Approval Queue until a decision is recorded. |
| `COMPLETE` | — | Terminal state after `APPROVE` or `REJECT`. `REQUEST_MORE_INFO` instead loops back to `EXECUTING` with the reviewer's feedback appended to the query context. |
| `FAILED` | — | Terminal state for unrecoverable errors (e.g. malformed input, exhausted revisions with no resolution path). |

Implement this as a LangGraph `StateGraph` in `agents/workflow.py`. Each node above is a separate function; do not collapse stages into fewer functions than shown — the frontend's stage-by-stage polling depends on these exact stage names being visible mid-workflow, not just at completion.

---

## 4. Data Models (Pydantic v2 — `app/models/schemas.py`)

All models must use camelCase JSON output (via `alias_generator` or per-field `Field(alias=...)`, with `populate_by_name=True`).

```python
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class InvestigationPlan(str, Enum):
    LIGHT = "LIGHT"
    FULL = "FULL"

class WorkflowStage(str, Enum):
    PLANNING = "PLANNING"
    EXECUTING = "EXECUTING"
    SCORING = "SCORING"
    CRITIQUING = "CRITIQUING"
    WRITING_REPORT = "WRITING_REPORT"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"

class WorkflowStatus(BaseModel):
    procurementId: str
    stage: WorkflowStage
    investigationPlan: InvestigationPlan
    revisionCount: int = 0
    maxRevisions: int = 3
    failureReason: Optional[str] = None

class RankedFact(BaseModel):
    factId: str
    text: str
    source: str              # "vector" | "graph"
    retrieverScore: float    # [0.0, 1.0] — raw normalized retriever score
    sourceWeight: float      # source-priority weight, e.g. 1.0 for Schedule M, 0.8 for WHO TRS
    finalScore: float        # retrieverScore * sourceWeight
    isPrimary: bool = False
    contradictionFlag: bool = False
    conflictsWith: Optional[str] = None   # factId of the opposing fact, if any

class RankedContext(BaseModel):
    facts: List[RankedFact]
    overallConfidence: float
    fallbackToVectorOnly: bool = False    # True if graph retrieval returned nothing

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class PricingRiskStatus(str, Enum):
    WITHIN_CEILING = "WITHIN_CEILING"
    EXCEEDS_CEILING = "EXCEEDS_CEILING"
    INDETERMINATE = "INDETERMINATE"

class PricingRisk(BaseModel):
    status: PricingRiskStatus
    ceilingPrice: Optional[float] = None
    quotedPrice: float
    excessAmount: Optional[float] = None

class RiskItem(BaseModel):
    level: RiskLevel
    rationale: str

class RiskAssessment(BaseModel):
    financialRisk: RiskItem
    complianceRisk: RiskItem
    contractRisk: RiskItem
    pricingRisk: PricingRisk
    overallRisk: RiskLevel
    confidenceScore: float   # evidence completeness, 0.0–1.0 — reduced by unresolved
                             # contradictions AND by indeterminate pricing checks

class ProcurementReport(BaseModel):
    vendorSummary: str
    financialAssessment: str
    complianceFindings: str
    flaggedContractClauses: List[str]
    evidenceSummary: str
    fusedContext: RankedContext
    riskAssessment: RiskAssessment
    riskExplanation: str
    recommendation: str

class ApprovalDecision(str, Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    REQUEST_MORE_INFO = "REQUEST_MORE_INFO"

class ApprovalRecord(BaseModel):
    decision: ApprovalDecision
    reason: Optional[str] = None
    decidedBy: str
    decidedAt: str

class SubmitProcurementResponse(BaseModel):
    procurementId: str
    status: WorkflowStatus

class ProcurementItemSummary(BaseModel):
    procurementId: str
    vendorName: str
    dealSize: float
    status: WorkflowStatus
    report: Optional[ProcurementReport] = None
    approval: Optional[ApprovalRecord] = None
    createdAt: str

class PendingApprovalItem(BaseModel):
    procurementId: str
    vendorName: str
    dealSize: float
    submittedAt: str
    overallRisk: RiskLevel
    confidenceScore: float
    investigationPlan: InvestigationPlan
    summary: str

class ApprovalDecisionRequest(BaseModel):
    decision: ApprovalDecision
    reason: Optional[str] = None
    decidedBy: Optional[str] = "Procurement Officer"

class ApprovalDecisionResponse(BaseModel):
    success: bool
    record: ApprovalRecord
```

---

## 5. RAG Subsystem — Vector RAG and Graph RAG are separate builds

These are two independent pipelines, both sourced from `backend/rag_storage/`, that only meet at query time inside the fusion module. Do not attempt to derive one from the other.

### 5.1 Vector RAG (`app/rag/ingest_vector.py`, `app/rag/vector_retriever.py`)

- Chunk PDFs (`RecursiveCharacterTextSplitter`, chunk_size=1200, overlap=150), embed each chunk, store in ChromaDB (`./vector_db`, persistent client).
- Metadata per chunk: `source_doc`, `page_number`.
- Query interface returns top-k passages with cosine similarity scores.
- **Build once, not per-request.** Check on startup whether `./vector_db` is already populated; only rebuild if empty or if `rag_storage/` contents changed.

### 5.2 Graph RAG (`app/rag/ingest_graph.py`, `app/rag/graph_retriever.py`)

- Extract `(subject, relation, object)` triples per chunk using an LLM, constrained to a **fixed relationship vocabulary** (do not allow open-ended relation strings — this is required to keep the graph traversable and comparable across documents):

  ```
  regulates, requires, requires_minimum, requires_maximum,
  applies_to, defined_in, exempts_from, supersedes, cites
  ```

- Extraction prompt must instruct the model: *"The relation MUST be exactly one of: [list]. If no listed relation type fits, do not extract that fact."*
- **Canonicalize entity names** before adding to the graph (lowercase, strip punctuation, collapse whitespace) to reduce duplicate nodes like "Schedule M" vs "Schedule-M". This is a known limitation — full synonym resolution (embedding-based entity merging) is out of scope for this build; canonicalization alone is sufficient for now.
- Build as a `networkx.MultiDiGraph`, persist to `procurement_graph.graphml`.
- Query interface: given query-relevant entities, return facts ranked by `1 / (1 + shortest_path_length)`.
- **Build once, not per-request** — triple extraction is far slower/more expensive than embedding (one LLM call per chunk). Cache the `.graphml` file; only regenerate when source PDFs change.

### 5.3 Fusion Module (`app/rag/fusion.py`) — the core mechanism, implement exactly

This must be a **pure, independently unit-testable function** — no LangGraph/agent coupling inside it.

```python
def fuse_retrieval_results(
    vector_results: list[VectorHit],   # .text, .cosine_similarity, .source_doc
    graph_results: list[GraphHit],     # .text, .path_length, .source_doc
    source_priority: dict[str, float], # e.g. {"schedule_m.pdf": 1.0, "who_trs_1025.pdf": 0.8}
    contradiction_threshold: float = 0.3,
) -> RankedContext:
    """
    Step 1 — Normalize:
        vector_score = cosine_similarity                 # already ~[0,1]
        graph_score  = 1 / (1 + path_length)

    Step 2 — Weight by source reliability:
        final_score = normalized_score * source_priority.get(source_doc, 0.5)

    Step 3 — Contradiction detection:
        Cluster facts by semantic similarity of their query-subject (embed
        and cosine-cluster the facts themselves — not string matching).
        Within a cluster, if two facts' claimed values differ beyond
        contradiction_threshold:
            - higher final_score fact  -> isPrimary = True
            - lower final_score fact   -> contradictionFlag = True,
                                           conflictsWith = <primary fact's factId>
        Do NOT discard the losing fact. Do NOT average the two values.

    Step 4 — Confidence:
        overall_confidence = weighted_avg(primary_fact_scores)
                              * (1 - contradiction_penalty)
        contradiction_penalty scales with number of unresolved contradictions
        (e.g. 0.15 per unresolved conflict, capped at 0.6).

    Returns RankedContext matching the frontend type exactly:
        facts: List[RankedFact], overallConfidence: float,
        fallbackToVectorOnly: bool (True if graph_results is empty)
    """
```

**Required unit tests (`tests/test_fusion.py`) — write these before considering Section 5.3 complete:**
1. Agreeing facts from both sources → no contradiction flag, high confidence.
2. Disagreeing facts → both flagged, higher-weighted fact marked primary, confidence measurably reduced.
3. Empty `graph_results` → `fallbackToVectorOnly = True`, scoring falls back to vector-only.
4. The losing fact in a contradiction is present in the output `facts` list, never silently dropped.

---

## 6. Risk Scoring (`app/agents/scorer.py`)

Four dimensions, computed from the `RankedContext` produced by fusion plus structured vendor data:

1. **Financial Risk** — solvency/liquidity heuristic relative to `dealSize`.
2. **Compliance Risk** — evaluated against Schedule M and WHO TRS 1025 facts retrieved via fusion; flags cold-chain or licensing gaps found in the evidence.
3. **Contract Risk** — inspects uploaded contract text (if provided) for indemnity caps, cure periods, termination-for-convenience clauses.
4. **Pricing Risk — deterministic, not LLM-based.** Compare the vendor's quoted price against a structured reference-price table (seed with a small DPCO/NPPA-style dataset keyed by product category in `db/seed.py`). Classify strictly as `WITHIN_CEILING`, `EXCEEDS_CEILING`, or `INDETERMINATE` (no reference price found for the category). **`INDETERMINATE` must reduce `confidenceScore`** on the overall `RiskAssessment` — never silently default to `WITHIN_CEILING` when reference data is missing.

`overallRisk` is the maximum severity across the four dimensions. `confidenceScore` reflects **evidence completeness**, not risk severity — it is reduced by both unresolved fusion contradictions (Section 5.3) and indeterminate pricing checks.

---

## 7. API Endpoints (`app/routers/procurement.py`, `app/routers/approval.py`)

| Method & Path | Request | Response | Notes |
|---|---|---|---|
| `POST /procurement/submit` | multipart form: `vendorName` (str, min 3), `dealSize` (float, >0), `procurementDetails` (str, min 15), `investigationPlan` (enum, default `FULL`), optional `contractDocument` (file) | `SubmitProcurementResponse` | Generates ID as `PR-2026-XXXX-[INITIALS]`. Creates record at stage `PLANNING`. Launches workflow via `BackgroundTasks`/`asyncio.create_task`. |
| `GET /procurement/{id}/status` | — | `WorkflowStatus` | 404 if not found. Must be cheap — polled every 1.5s by the frontend. |
| `GET /procurement/{id}/report` | — | `ProcurementReport` | 404 with `{"detail": "Report not ready"}` if still in progress. |
| `GET /procurement/all` | — | `List[ProcurementItemSummary]`, sorted descending by `createdAt` | Pre-seed with ≥2 realistic cases on startup so the dashboard isn't empty. |
| `GET /approval/pending` | — | `List[PendingApprovalItem]` | Only items where `stage == AWAITING_APPROVAL` and undecided. |
| `POST /approval/{id}/decide` | `ApprovalDecisionRequest` | `ApprovalDecisionResponse` | `REJECT`/`REQUEST_MORE_INFO` require a non-empty `reason` — return 422 otherwise. `APPROVE`/`REJECT` → stage `COMPLETE`. `REQUEST_MORE_INFO` → increment `revisionCount`, stage back to `EXECUTING` with feedback appended to context. |

CORS: enable for `http://localhost:5173` (Vite dev server).

---

## 8. Directory Structure

```
backend/
├── app/
│   ├── main.py                     # FastAPI app, CORS, router mounting, startup ingestion check
│   ├── config.py                   # pydantic-settings, .env driven
│   ├── models/
│   │   └── schemas.py              # Section 4
│   ├── db/
│   │   ├── session.py              # SQLite via SQLModel
│   │   └── seed.py                 # seed cases + pricing reference dataset
│   ├── rag/
│   │   ├── ingest_vector.py        # Section 5.1
│   │   ├── vector_retriever.py
│   │   ├── ingest_graph.py         # Section 5.2
│   │   ├── graph_retriever.py
│   │   └── fusion.py               # Section 5.3
│   ├── agents/
│   │   ├── state.py                # WorkflowState definition
│   │   ├── planner.py
│   │   ├── executor.py             # calls vector_retriever + graph_retriever + fusion
│   │   ├── scorer.py                # Section 6
│   │   ├── critic.py
│   │   ├── writer.py
│   │   └── workflow.py             # LangGraph StateGraph — Section 3
│   └── routers/
│       ├── procurement.py
│       └── approval.py
├── rag_storage/                    # already exists — do not modify
├── tests/
│   └── test_fusion.py              # required, see Section 5.3
├── requirements.txt
├── .env.example
└── README.md
```

---

## 9. Tech Stack

Python 3.12+ · FastAPI + uvicorn · Pydantic v2 · LangGraph · LangChain · ChromaDB · NetworkX · pypdf · SQLModel/SQLite · python-multipart · python-dotenv. LLM provider should be pluggable (OpenAI / Google Gemini / local fallback) via `.env` configuration — do not hardcode a single provider.

---

## 10. Verification Checklist (confirm all before declaring the build complete)

- [ ] `uvicorn app.main:app --reload` starts with zero errors
- [ ] All 4 fusion unit tests pass (Section 5.3)
- [ ] `GET /procurement/all` returns seeded cases matching `ProcurementItemSummary` field names exactly
- [ ] Submitting a case via Swagger UI (`/docs`) drives it through all workflow stages without manual intervention
- [ ] A deliberately contradictory test case (mock vendor claim vs. mock regulation fact) produces a `contradictionFlag = True` in the resulting report
- [ ] A test case with no matching pricing category correctly returns `INDETERMINATE`, not a false `WITHIN_CEILING`
- [ ] Frontend (`npm run dev`, `VITE_USE_MOCK_API=false`) renders a submitted case end-to-end with no console errors

Build in the phased order of Sections 3 → 4 → 7 (scaffolding + schemas + endpoints with stub logic) → 5 (RAG subsystem) → 6 (scoring) → full integration. Stop and report back after the fusion unit tests pass, before wiring it into the full agent workflow — that is the highest-risk component and the one this project's patent filing depends on actually working, not just being designed.
