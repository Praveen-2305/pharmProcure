# AutonoSource (`pharmProcure`) — Project Completion Status & Gap Analysis Report

**Document Title:** AutonoSource End-to-End Project Status, Implemented Features & Production Gap Analysis  
**Repository:** `Praveen-2305/pharmProcure`  
**Active Branch:** `kamalesh`  
**Generated Date:** September 19, 2026  
**Target Audience:** Engineering Leads, Product Stakeholders, AI/ML Engineers, Compliance Auditors  

---

## Executive Summary

**AutonoSource (`pharmProcure`)** is an autonomous multi-agent procurement intelligence platform engineered specifically for the Indian pharmaceutical and healthcare supply chain. Its primary objective is to automate vendor risk evaluation, verify compliance with the **CDSCO Drugs and Cosmetics Act (1940)**, **Schedule M Good Manufacturing Practices (GMP)**, and **WHO TRS 1025 cold chain standards**, while strictly enforcing statutory price ceilings under **DPCO 2013** denominated in **Indian Rupees (INR / ₹)**.

This report provides a forensic inventory of:
1. **What has been fully engineered and completed** across backend agents, databases, algorithms, APIs, and the frontend cockpit.
2. **What remains incomplete, stubbed, or missing** to achieve 100% enterprise production readiness.
3. **A phased, prioritized implementation roadmap** to guide developers and autonomous agents in completing the project.

---

## 1. Current Architectural Accomplishments & Completed Components

The platform has established an advanced Proof-of-Concept (POC v2.0) foundation with stateful orchestration, a hybrid knowledge retrieval engine, relational governance storage, and an interactive React dashboard.

```
                               ┌─────────────────────────────────────────┐
                               │   Frontend Cockpit (React 18 + Vite)    │
                               │  - High-contrast dark glassmorphism     │
                               │  - 5 Full screens & specialized badges  │
                               └────────────────────┬────────────────────┘
                                                    │ REST / JSON (camelCase)
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │     FastAPI Gateway (Port 8000)         │
                               │  - /procurement/* (Audit & Catalogs)    │
                               │  - /approval/* (Human-in-the-loop)      │
                               └────────────────────┬────────────────────┘
                                                    │
                         ┌──────────────────────────┴──────────────────────────┐
                         ▼                                                     ▼
        ┌──────────────────────────────────┐                  ┌──────────────────────────────────┐
        │  LangGraph Multi-Agent Engine    │                  │  Persistent Multi-Database Hub   │
        │  - Planner (LIGHT vs FULL)       │                  │  - SQLite 3 (6 Relational Tables)│
        │  - Hybrid RAG (Vector + Graph)   │◄────────────────►│  - Qdrant (768-dim Dense Vectors)│
        │  - Web Due Diligence Scraper     │                  │  - NetworkX Graph (5,757 Nodes)  │
        │  - 4D Risk Scorer (INR)          │                  └──────────────────────────────────┘
        │  - Critic (Confidence Threshold) │
        │  - Report Writer (INR Dossier)   │
        └──────────────────────────────────┘
```

---

### 1.1 Multi-Agent LangGraph Pipeline (`backend/src/agents/`)

The workflow engine is stateful, cyclic, and managed via `StateGraph(WorkflowState)` in [`workflow.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/workflow.py):

- [x] **State Schema ([`state.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/state.py)):** Strongly typed `WorkflowState` tracking `procurementId`, `vendorName`, `dealSize` (in INR), `stage`, `investigationPlan`, `evidence_bundle`, `riskAssessment`, and `report`.
- [x] **Planner Agent ([`planner.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/planner.py)):** Checks local database cache for known vendor profiles. Dynamically routes deal requests into:
  - `LIGHT`: Bypasses external retrieval for pre-vetted vendors.
  - `FULL`: Fans out parallel execution to both the RAG Agent and Scraper Agent.
- [x] **RAG Agent ([`rag_agent.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/rag_agent.py)):** Coordinates simultaneous vector retrieval from Qdrant and topological traversal through the 5,757-node NetworkX property graph.
- [x] **Scraper Agent ([`scraper_agent.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/scraper_agent.py)):** Pulls structured financial data from the 50 registered vendors directory in SQLite, performs DPCO 2013 ceiling comparisons, triggers external web searches, and caches synthesized profiles into `vendor_profiles`.
- [x] **External Regulatory Hunter ([`web_scraper.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/web_scraper.py)):**
  - Live Tavily search querying CDSCO show-cause notices, FDA 483 inspection citations, and court litigation.
  - Live HTTP fallback parser (DuckDuckGo HTML) if Tavily key is unconfigured.
  - Dual extraction parser: LLM structured extraction via Groq/Gemini with rule-based regex fallback.
- [x] **Risk Scorer Agent ([`scorer.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/scorer.py)):** Quantifies gathered evidence across four dimensions:
  - **Financial Risk:** Balance sheets, liquidity, credit rating to numerical score mapping (AAA=850 down to B=520).
  - **Compliance Risk:** Schedule M GMP certification, WHO-GMP, FDA approval, and inspection notices.
  - **Contractual Risk:** Liability limitation caps (penalizing caps exceeding 1.0x contract value) and cold chain SLA terms.
  - **Pricing Risk:** Exact mathematical variance calculation against official NPPA DPCO 2013 price ceilings in INR.
  - **Confidence Calculation:** Computes confidence score penalized by unresolved regulatory contradictions.
- [x] **Critic Agent ([`critic.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/critic.py)):** Evaluates evidence completeness against the required `0.80` confidence threshold. If confidence `< 0.80` and `revision_count < 3`, increments the revision counter and triggers a re-investigation loop.
- [x] **Report Writer Agent ([`writer.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/writer.py)):** Assembles the executive `ProcurementReport` with ranked evidence facts, flagged contract clauses, audit explanations, and clear recommendations (`APPROVE`, `CONDITIONAL APPROVAL`, `REJECT / ESCALATE`).

---

### 1.2 Hybrid RAG & 4-Step Contradiction Resolution (`backend/src/rag_pipeline/`)

The platform solves the critical legal problem of conflicting clauses between vendor proposals and statutory law:

- [x] **Vector Store ([`vector_store.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/rag_pipeline/vector_store.py)):**
  - Dense 768-dimensional embeddings generated with `nomic-ai/nomic-embed-text-v1.5`.
  - Local disk storage under [`backend/processed_data/qdrant/`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/processed_data/qdrant/).
- [x] **Graph Store ([`graph_store.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/rag_pipeline/graph_store.py)):**
  - NetworkX in-memory property graph with **5,757 nodes** mapping statutory acts, licensing rules, and vendor nodes.
  - Canonical XML GraphML format ([`knowledge_graph.graphml`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/processed_data/graph/knowledge_graph.graphml)) and lightweight JSON format ([`knowledge_graph.json`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/processed_data/graph/knowledge_graph.json)).
  - Multi-tier matching: exact identifier match, lowercase substring search, and token-intersection matching.
- [x] **4-Step Fusion Algorithm ([`fusion.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/rag_pipeline/fusion.py)):**
  1. **Score Normalization:** Normalizes vector cosine similarities and graph path lengths (`1 / (1 + distance)`).
  2. **Legal Source Priority Weighting:** Applies authoritative legal weights ($W_s$): Primary Acts ($1.0$), WHO Standards ($0.85$), Contract drafts ($0.60$).
  3. **Contradiction Detection:** Evaluates conflicting ranges and terms (e.g. ambient 15°C–25°C transit vs statutory WHO TRS 1025 2°C–8°C cold chain mandate). The winning statutory fact is marked `is_primary = True`; the subordinate vendor fact is marked `contradiction_flag = True` and links to `conflicts_with = fact_id`. Losing facts are **preserved** rather than discarded.
  4. **Confidence Penalization:** Penalizes overall confidence when unresolved contradictions are detected:
     $$\text{confidence} = \text{weighted\_avg}(\text{facts}) \times (1 - \text{penalty})$$

---

### 1.3 Persistent Relational Database Subsystem (`backend/src/db/`)

Persistent storage is located at [`backend/processed_data/sqlite/procurement_cases.db`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/processed_data/sqlite/procurement_cases.db) and managed by `CaseStore` in [`session.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/db/session.py):

- [x] **6 Relational Tables Fully Implemented:**
  1. `vendors`: 50 Indian pharmaceutical vendors with PAN/GSTIN, state licenses, GMP status, turnover, and credit ratings.
  2. `vendor_products`: 100+ catalog items with active ingredients, dosage forms, package sizes, cold chain mandates, and unit prices in INR.
  3. `pricing_references`: NPPA DPCO 2013 statutory price ceilings and notification dates.
  4. `procurement_cases`: Procurement lifecycle states, deal sizes in INR, report payloads, and sign-offs.
  5. `audit_logs`: Forensic GxP audit log capturing state transitions, actors, and events.
  6. `vendor_profiles`: Cached due diligence records, litigation summaries, and regulatory warnings.
- [x] **Pricing Service ([`pricing.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/db/pricing.py)):** Checks quoted unit prices against DPCO 2013 ceilings in SQLite, with JSON fallback.
- [x] **Seeder Automation ([`seed.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/db/seed.py)):** Seeds baseline cases for immediate testing on startup.

---

### 1.4 REST API Gateways (`backend/src/routers/`)

FastAPI routers exposing full CRUD and workflow operations conforming to the camelCase frontend contract:

- [x] **Procurement Router ([`procurement.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/routers/procurement.py)):**
  - `POST /procurement/submit` — Submits new procurement requests with background worker execution.
  - `GET /procurement/{id}/status` — Polled by frontend every 1.5s for live stage progression.
  - `GET /procurement/{id}/report` — Fetches synthesized report once ready.
  - `GET /procurement/all` — Returns all active and historical procurement cases.
  - `GET /procurement/logs` — Global audit log feed.
  - `GET /procurement/{id}/audit` — Chronological audit timeline for a specific case.
  - `GET /procurement/vendors` & `GET /procurement/vendors/{id}` — 50-vendor directory and product catalog queries.
  - `GET /procurement/pricing-catalog` — Statutory DPCO price ceiling lookup.
- [x] **Human Approval Router ([`approval.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/routers/approval.py)):**
  - `GET /approval/pending` — Lists cases in `AWAITING_APPROVAL`.
  - `POST /approval/{id}/decide` — Records executive decision (`APPROVE`, `REJECT`, `REQUEST_MORE_INFO`) with mandatory rejection rationale.

---

### 1.5 Frontend Executive Cockpit (`frontend/src/`)

An executive single-page application built with React 18, TypeScript, Tailwind CSS, and Framer Motion:

- [x] **Theme & Design System:** High-contrast dark theme with translucent glassmorphic cards and 60fps micro-animations.
- [x] **5 Primary Views:**
  1. [`LandingPage.tsx`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/frontend/src/pages/Landing/LandingPage.tsx): Comprehensive platform marketing, feature matrix, and architecture showcase.
  2. [`DashboardPage.tsx`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/frontend/src/pages/Dashboard/DashboardPage.tsx): Metric summary cards, risk distribution charts, and active case tables.
  3. [`SubmitRequestForm.tsx`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/frontend/src/pages/SubmitRequest/SubmitRequestForm.tsx): Deal submission form with vendor autocompletion and file upload support.
  4. [`VendorReviewPage.tsx`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/frontend/src/pages/VendorReview/VendorReviewPage.tsx): Deep-dive audit report with [`RiskBreakdown.tsx`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/frontend/src/pages/VendorReview/RiskBreakdown.tsx) and [`EvidenceTrail.tsx`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/frontend/src/pages/VendorReview/EvidenceTrail.tsx).
  5. [`ApprovalQueuePage.tsx`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/frontend/src/pages/ApprovalQueue/ApprovalQueuePage.tsx): Human-in-the-loop executive sign-off queue with approval and rejection modal dialogs.
- [x] **Specialized Visual Components:**
  - [`ConfidenceBadge.tsx`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/frontend/src/components/ConfidenceBadge.tsx): Color-coded confidence score gauge with revision loop indicators.
  - [`ContradictionFlag.tsx`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/frontend/src/components/ContradictionFlag.tsx): Warning banner rendering side-by-side contractual vs statutory contradictions.
  - [`RiskLevelTag.tsx`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/frontend/src/components/RiskLevelTag.tsx): Low/Medium/High risk tags with Lucide icons.
- [x] **Dual-Mode API Layer ([`client.ts`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/frontend/src/api/client.ts)):** Supports both live backend communication and decoupled mock mode via `VITE_USE_MOCK_API`.

---

### 1.6 Ingestion & Build Infrastructure (`backend/build/`)

- [x] **Master Build Orchestrator ([`build_all.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/build/build_all.py)):** Safe, non-destructive pipeline detecting existing datasets to avoid accidental overwrites of heavy vector and graph artifacts.
- [x] **SQLite Database Seeder ([`seed_data.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/build/seed_data.py)):** Populates the 50 vendors directory and DPCO catalog from raw JSON into SQLite.
- [x] **Groq Multi-Key High-Throughput Pipeline ([`build_knowledge_graph_groq.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/build/build_knowledge_graph_groq.py)):** Key-ring concurrency engine distributing requests across up to 100 Groq API keys to build the 5,757-node graph without hitting rate limits.
- [x] **Canonical Regulatory Markdown Corpus (`backend/ingestion/rag_and_graph/`):**
  - Drugs and Cosmetics Act (1940) & 2024 Rules (2.1 MB)
  - DPCO 2013 Pricing Orders & Amendments
  - Schedule M GMP Standards
  - WHO TRS 1025 Annex 7 (Cold Chain) & WHO TRS 908 (Storage)
  - WHO Good Manufacturing Practices Guidelines

---

## 2. Gap Analysis: What Has NOT Been Implemented

While the core pipeline, frontend, and knowledge retrieval subsystems are fully functional, several critical capabilities must be implemented before the platform can transition from a functional POC into an enterprise-grade production platform.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GAP SEVERITY MATRIX                              │
├───────────────────────────────────────────────────┬──────────────┬──────────┤
│ Area / Missing Capability                         │ Severity     │ Impact   │
├───────────────────────────────────────────────────┼──────────────┼──────────┤
│ 1. Dynamic PDF Contract Extraction & Ingestion    │ 🔴 HIGH      │ Pipeline │
│ 2. Dynamic LLM Reasoning Across All Agent Nodes   │ 🔴 HIGH      │ AI Logic │
│ 3. Enterprise Auth & Role-Based Access Control    │ 🔴 HIGH      │ Security │
│ 4. Backend Automated Pytest Suite                 │ 🟡 MEDIUM    │ Quality  │
│ 5. Live NPPA Gazette & Court Scraper Cron Sync    │ 🟡 MEDIUM    │ Data     │
│ 6. Real-Time Streaming (WebSockets / SSE)         │ 🟡 MEDIUM    │ UX       │
│ 7. Production Database Migration (PostgreSQL)     │ 🟢 LOW       │ Infra    │
│ 8. Enterprise ERP / CLM Webhook Integrations      │ 🟢 LOW       │ Ops      │
└───────────────────────────────────────────────────┴──────────────┴──────────┘
```

---

### Gap 1: Dynamic PDF Contract Extraction & Ingestion on Deal Submission (🔴 High)
- **Current State:** The `POST /procurement/submit` endpoint accepts an uploaded file (`contractDocument: Optional[UploadFile] = File(None)`), but currently only stores the filename string in `WorkflowState["contractDocumentPath"]`.
- **Missing Implementation:**
  - Dynamic disk caching of the uploaded contract PDF.
  - Text extraction and semantic parsing via `pymupdf4llm` or `pypdf`.
  - On-the-fly chunking with `MarkdownTextSplitter` and embedding generation.
  - Ephemeral Qdrant collection or session-specific vector index so that custom uploaded contracts can be compared against the static regulatory corpus in real time.

---

### Gap 2: Live LLM Invocation in All Agent Nodes (🔴 High)
- **Current State:**
  - System prompts are cleanly written and isolated in [`backend/src/prompts/`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/prompts/) (`planner_prompt.py`, `scorer_prompt.py`, `critic_prompt.py`, `writer_prompt.py`).
  - However, within the agent node executions:
    - [`planner.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/planner.py) performs a deterministic cache check rather than an LLM planning assessment.
    - [`scorer.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/scorer.py) uses deterministic Python `if/elif` scoring rules.
    - [`critic.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/critic.py) checks `confidence < 0.80` with a hardcoded string template.
    - [`writer.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/writer.py) constructs `ProcurementReport` using format strings.
  - Only [`web_scraper.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/web_scraper.py) and [`build_knowledge_graph_groq.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/build/build_knowledge_graph_groq.py) actively execute live LLM calls.
- **Missing Implementation:**
  - Connect `ChatOpenAI(base_url="https://api.groq.com/openai/v1")` or Google Gemini to `scorer.py`, `critic.py`, and `writer.py`.
  - Use Pydantic structured outputs (`llm.with_structured_output(...)`) to dynamically extract complex legal nuances, nuanced audit justifications, and contextual explanations.
  - Preserve deterministic formulas as verified mathematical guardrails to prevent LLM hallucinations on DPCO pricing ceilings.

---

### Gap 3: Authentication, Authorization & Role-Based Access Control (🔴 High)
- **Current State:** All API routes are completely open. Any client can submit a multi-crore deal or approve a high-risk vendor without credentials.
- **Missing Implementation:**
  - JWT-based authentication (`python-jose`, `passlib[bcrypt]`).
  - User model with 3 enterprise roles:
    1. `PROCUREMENT_OFFICER`: Can submit requests and view status.
    2. `COMPLIANCE_AUDITOR`: Can view logs, inspect contradiction trails, and edit regulatory notes.
    3. `EXECUTIVE_APPROVER`: Exclusive authority to execute `/approval/{id}/decide`.
  - FastAPI dependency guards: `@router.post("/approval/{id}/decide", dependencies=[Depends(require_role("EXECUTIVE_APPROVER"))])`.

---

### Gap 4: Backend Automated Testing Suite (🟡 Medium)
- **Current State:** Frontend has Vitest unit tests in `frontend/tests/`, but backend currently relies on manual CLI test scripts (`backend/scripts/test_pipeline_run.py`, `run_agent_pipeline.py`).
- **Missing Implementation:**
  - Formal `backend/tests/` directory with `pytest` test runners:
    - `test_fusion.py`: Test all 4 steps of the contradiction detection algorithm and score weighting.
    - `test_pricing.py`: Unit tests verifying mathematical DPCO ceiling calculations and excess alerts.
    - `test_workflow.py`: End-to-end LangGraph execution tests verifying LIGHT and FULL routing branches.
    - `test_api.py`: FastAPI `TestClient` tests verifying HTTP status codes and camelCase JSON schema serialization.

---

### Gap 5: Automated Regulatory Gazette Synchronization (🟡 Medium)
- **Current State:** The NPPA DPCO 2013 catalog in [`pricing_ceiling_catalog.json`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/ingestion/sql/pricing_ceiling_catalog.json) is a static snapshot.
- **Missing Implementation:**
  - Automated scraper or RSS/gazette monitor targeting NPPA website notifications (`https://www.nppaindia.nic.in/`).
  - Automated weekly cron job to parse gazette notification tables and update `pricing_references` in the database.

---

### Gap 6: Real-Time Streaming & Live Step Updates (🟡 Medium)
- **Current State:** Frontend uses polling (`GET /procurement/{id}/status` every 1.5s).
- **Missing Implementation:**
  - FastAPI WebSocket endpoint (`/ws/procurement/{id}`) or Server-Sent Events (SSE) route (`/procurement/{id}/stream`).
  - Connect LangGraph `.astream_events()` to stream agent actions, active queries, and intermediate findings directly to the UI in real time.

---

### Gap 7: Production Database Infrastructure Migration (🟢 Low)
- **Current State:** Uses local embedded SQLite (`procurement_cases.db`) and local NetworkX in-memory graph.
- **Missing Implementation:** (Detailed in [`06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/project_information/06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md)):
  - PostgreSQL / CockroachDB migration for relational multi-tenancy and connection pooling.
  - Neo4j / Memgraph migration for external persistent graph storage with Cypher queries.
  - Qdrant Cloud cluster setup with API key isolation.

---

### Gap 8: Enterprise Export & ERP/CLM Integration (🟢 Low)
- **Current State:** Final report is only rendered in the browser.
- **Missing Implementation:**
  - PDF Export: Generate official signed PDF audit dossiers with CDSCO/GxP compliance watermarks using `weasyprint` or `reportlab`.
  - Webhook triggers sending approved deal payloads directly to SAP Ariba, Coupa, or Workday.

---

## 3. Prioritized Implementation Roadmap

To systematically take AutonoSource from its current POC state to 100% complete enterprise production readiness, execute the following three phases:

### Phase 1: Core Intelligence & Pipeline Completeness (Target: Immediate)
1. **Contract Ingestion Engine:**
   - Add PDF parsing utility (`backend/src/rag_pipeline/contract_parser.py`) using `pymupdf4llm`.
   - Update `submit_procurement` endpoint to parse and extract text from uploaded contracts.
   - Index extracted clauses into an ephemeral vector collection for live comparison.
2. **Hybrid LLM Wiring in Agent Nodes:**
   - Integrate Groq ChatOpenAI into `scorer.py` and `writer.py` with Pydantic structured output.
   - Maintain deterministic pricing formulas as strict guardrails against hallucinations.
3. **Automated Backend Pytest Suite:**
   - Create `backend/tests/` with unit tests for fusion logic, pricing math, and REST endpoints.

### Phase 2: Security, Real-Time Streaming & UX Hardening (Target: Secondary)
1. **RBAC Authentication:**
   - Implement JWT token authentication and role checking in FastAPI.
   - Add login screen and auth context in frontend.
2. **WebSocket / SSE Live Streaming:**
   - Implement SSE route streaming LangGraph agent node execution traces to the UI.
   - Upgrade frontend polling into real-time reactive socket updates.
3. **PDF Audit Dossier Export:**
   - Add an endpoint `GET /procurement/{id}/export-pdf` generating a watermarked executive dossier.

### Phase 3: Enterprise Cloud Scale & Data Automation (Target: Production Launch)
1. **Database Migration to PostgreSQL & Neo4j:**
   - Migrate `CaseStore` from SQLite to SQLAlchemy/PostgreSQL.
   - Export NetworkX graph into Neo4j with Cypher search integrations.
2. **Automated NPPA Gazette Synchronization:**
   - Create scheduled scraper for live gazette price updates.
3. **ERP / Procurement Webhook Connectors:**
   - Implement outgoing webhooks for SAP Ariba and Coupa.

---

## 4. Key Operational Constraints & Conventions

When modifying or extending this codebase, developers and autonomous agents must strictly follow these rules:

1. **Currency Mandate:** All monetary amounts, deal sizes, unit prices, and ceiling checks must be denominated in **Indian Rupees (INR / ₹)**.
2. **Directory Integrity:**
   - Source code resides in `backend/src/` (never `backend/app/`).
   - Prompt engineering modules reside in `backend/src/prompts/`.
   - Persistent database files reside in `backend/processed_data/`.
3. **Dataset Preservation:** Never execute build scripts with `--force-clean` unless intentionally regenerating the heavy 5,757-node graph or Qdrant collections. Use `python backend/build/seed_data.py` to refresh relational tables.
4. **Git Branching:** All updates must be committed to the active feature branch **`kamalesh`**.

---

*Report prepared and certified for the AutonoSource (`pharmProcure`) engineering repository.*
