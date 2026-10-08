# AutonoSource Backend Engine (`backend/`)

The **AutonoSource Backend** is an autonomous, multi-agent investigative platform designed to assess pharmaceutical vendor risks, verify regulatory compliance under CDSCO and WHO guidelines, audit contract terms, detect legal contradictions, and enforce statutory price ceilings under DPCO 2013 in Indian Rupees (INR / ₹).

---

## 🏗️ Architecture & Pipeline Overview

Rather than relying on single-shot LLM prompts or basic RAG retrieval, the backend orchestrates a team of specialized **LangGraph AI Agents** in a stateful, cyclic workflow with parallelized retrieval and regulatory investigation:

```
                            ┌─────────────────┐
                            │  Planner Agent  │
                            └────────┬────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │ (FULL investigation fan-out)    │
                    ▼                                 ▼
         ┌─────────────────────┐           ┌─────────────────────┐
         │      RAG Agent      │           │    Scraper Agent    │
         │  • 768-dim Qdrant   │           │  • 50-Vendor SQLite │
         │  • 5,757-Node Graph │           │  • Web Due Dilig.   │
         │  • 4-Step Fusion    │           │  • DPCO 2013 (INR)  │
         └──────────┬──────────┘           └──────────┬──────────┘
                    │                                 │
                    └────────────────┬────────────────┘
                                     │ (Fan-in evidence)
                                     ▼
                          ┌─────────────────────┐
                          │  Risk Scorer Agent  │ ◄─────────────────────────┐
                          └──────────┬──────────┘                           │
                                     │                                      │
                                     ▼                                      │
                          ┌─────────────────────┐    Confidence < 0.80      │
                          │    Critic Agent     │ ──────────────────────────┘
                          └──────────┬──────────┘    (Max 3 revision loops)
                                     │
                                     │ Confidence >= 0.80
                                     ▼
                          ┌─────────────────────┐
                          │ Report Writer Agent │
                          │ (INR-based Dossier) │
                          └──────────┬──────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │   Human Approval    │
                          │ (/approval/decide)  │
                          └─────────────────────┘
```

### The Specialized Agent Nodes:

1. **Planner Agent ([`src/agents/planner.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/planner.py)):**
   - Assesses vendor relationship history and deal scale using dedicated prompts ([`src/prompts/planner_prompt.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/prompts/planner_prompt.py)).
   - Dynamically routes to `LIGHT` (low-value, known supplier < ₹5,00,000) or `FULL` (high-value ≥ ₹5,00,000, new or critical supplier).
   - In `FULL` mode, fans out execution simultaneously to both the RAG Agent and Scraper Agent.

2. **RAG Agent ([`src/agents/rag_agent.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/rag_agent.py)):**
   - Directly coordinates parallel retrieval across dense vector space and topological knowledge graphs.
   - Queries the local Qdrant collection in [`processed_data/qdrant/`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/processed_data/qdrant/).
   - Traverses the 5,757-node property graph in [`processed_data/graph/knowledge_graph.graphml`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/processed_data/graph/knowledge_graph.graphml).
   - Applies the 4-step fusion algorithm ([`src/rag_pipeline/fusion.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/rag_pipeline/fusion.py)) to detect regulatory contradictions (e.g. ambient 15°C–25°C transit vs WHO TRS 1025 cold chain mandate of 2°C–8°C).

3. **Scraper Agent ([`src/agents/scraper_agent.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/scraper_agent.py)):**
   - Connects directly to SQLite [`processed_data/sqlite/procurement_cases.db`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/processed_data/sqlite/procurement_cases.db) to retrieve verified financials, credit scores, and regulatory certifications from the 50 registered vendors directory.
   - Evaluates unit quotes against statutory ceiling prices under DPCO 2013 denominated in Indian Rupees (INR / ₹).
   - Executes live external due diligence searches ([`src/agents/web_scraper.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/web_scraper.py)) across CDSCO alerts, FDA 483 citations, product recalls, and MCA court records using [`src/prompts/scraper_prompt.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/prompts/scraper_prompt.py).
   - Automatically caches synthesized regulatory profiles back into the `vendor_profiles` SQLite table.

4. **Risk Scorer Agent ([`src/agents/scorer.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/scorer.py)):**
   - Quantifies gathered evidence across 4 distinct dimensions using [`src/prompts/scorer_prompt.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/prompts/scorer_prompt.py):
     - **Financial Risk:** Liquidity, credit ratings, debt-to-equity ratios.
     - **Compliance Risk:** CDSCO Drugs & Cosmetics Act 1940, Schedule M GMP certification, cold chain transit compliance.
     - **Contractual Risk:** Liability caps, indemnity obligations, termination notice periods.
     - **Pricing Risk:** Exact mathematical variance against statutory DPCO 2013 ceiling benchmarks in INR.
   - Computes an aggregated confidence score penalized by unresolved contradictions.

5. **Critic Agent ([`src/agents/critic.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/critic.py)):**
   - Evaluates evidence completeness against the confidence threshold (0.80) using [`src/prompts/critic_prompt.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/prompts/critic_prompt.py).
   - If confidence is < 0.80 and revision count < 3, triggers a targeted revision loop with updated investigation instructions for the RAG and Scraper agents.

6. **Report Writer Agent ([`src/agents/writer.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/writer.py)):**
   - Compiles findings, flagged clauses, contradiction trails, and recommendations into an executive dossier (`ProcurementReport`) formatted with INR figures using [`src/prompts/writer_prompt.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/prompts/writer_prompt.py).

---

## 🗄️ Relational Database Schema & Data Organization

The persistent SQLite database is located at [`backend/processed_data/sqlite/procurement_cases.db`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/processed_data/sqlite/procurement_cases.db) and managed by `CaseStore` in [`src/db/session.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/db/session.py):

| Table Name | Records | Description |
|---|---|---|
| `vendors` | 50 | Verified Indian pharmaceutical vendors with PAN/GSTIN, state licenses, GMP status, financial ratings, and audit histories. |
| `vendor_products` | 100+ | Vendor-specific catalog items with active substances, dosage forms, cold chain requirements, and unit pricing in INR. |
| `pricing_references`| Active | Official NPPA DPCO 2013 statutory price ceilings, notified dates, unit specifications, and formulation details in INR. |
| `procurement_cases` | Active | Active and historical procurement case states, quoted deal sizes in INR, items requested, and executive reports. |
| `audit_logs` | Append-only | Forensic governance audit trail recording every state change, agent decision, confidence score, and approval decision. |
| `vendor_profiles` | Cached | Synthesized intelligence profiles, adverse regulatory findings, CDSCO warning letters, and search timestamps. |

---

## 📂 Backend Directory Layout

```
backend/
├── src/                               # Application Core Logic & Runtime
│   ├── main.py                        # FastAPI application setup, CORS, route mounting, and root discovery
│   ├── config.py                      # Global environment configuration (Qdrant path, API keys)
│   ├── agents/                        # LangGraph agent implementations
│   │   ├── planner.py                 # Evaluates deal size in INR and selects LIGHT vs FULL strategy
│   │   ├── rag_agent.py               # Coordinates dual vector and 5,757-node graph retrieval
│   │   ├── scraper_agent.py           # Queries SQLite vendor profiles and external regulatory intel
│   │   ├── web_scraper.py             # Tavily due diligence search with rule-based regex fallback
│   │   ├── scorer.py                  # 4D risk scoring rubric & confidence calculation in INR
│   │   ├── critic.py                  # Quality critique & contradiction resolution revision loop
│   │   ├── writer.py                  # Executive dossier synthesis in INR
│   │   ├── workflow.py                # LangGraph StateGraph compiling all agent nodes
│   │   └── state.py                   # Pydantic WorkflowState schema definition
│   ├── prompts/                       # Modular prompt templates enforcing INR & Indian regulations
│   │   ├── __init__.py                # Clean prompt exports
│   │   ├── planner_prompt.py          # LIGHT vs FULL threshold logic (₹5,00,000 threshold)
│   │   ├── scraper_prompt.py          # Regulatory compliance & adverse search criteria
│   │   ├── scorer_prompt.py           # 4-dimensional risk scoring rubric
│   │   ├── critic_prompt.py           # Self-reflection & audit loop prompt
│   │   └── writer_prompt.py           # Executive report schema in INR
│   ├── models/                        # Pydantic domain models with camelCase serialization
│   │   └── schemas.py                 # ProcurementItem, WorkflowStatus, RiskAssessment, etc.
│   ├── db/                            # SQLite persistence layer & pricing service
│   │   ├── session.py                 # Thread-safe CaseStore supporting all 6 relational tables
│   │   ├── pricing.py                 # Connects to SQLite pricing_references with JSON fallback
│   │   └── seed.py                    # Seed definitions for baseline procurement cases
│   ├── rag_pipeline/                  # Knowledge retrieval subsystem
│   │   ├── fusion.py                  # 4-step score normalization, weighting, and contradiction resolution
│   │   ├── vector_store.py            # Direct Qdrant client reading from processed_data/qdrant/
│   │   ├── graph_store.py             # Multi-tier node matching across the 5,757-node property graph
│   │   └── web_scraper.py             # Web scraper module alias for backward compatibility
│   └── routers/                       # FastAPI REST API controllers
│       ├── procurement.py             # Case submission, status, reports, audit logs, vendors, pricing catalog
│       └── approval.py                # Executive review queue and sign-off decisions
├── build/                             # Database Ingestion & Build Automation
│   ├── build_all.py                   # Master builder (preserves existing datasets unless rebuild requested)
│   ├── seed_data.py                   # Ingests 50 vendors, products, and DPCO catalog into SQLite
│   ├── ingest_rag_docs.py             # Chunks regulatory documents & embeds into Qdrant vector store
│   ├── build_knowledge_graph.py       # Compiles regulatory ontology into NetworkX GraphML
│   ├── graph/                         # Knowledge graph construction tools
│   │   ├── build_kg_groq.py           # High-throughput multi-key Groq knowledge graph pipeline
│   │   └── audit_groq_keys.py         # API key validation and rate limit auditor
│   └── README.md                      # Detailed build guide and safety instructions
├── ingestion/                         # Canonical Data Ingestion Sources
│   ├── rag_and_graph/                 # Regulatory Acts (CDSCO, DPCO 2013, Schedule M, WHO TRS 1025)
│   └── sql/                           # 50 Indian vendors directory & statutory DPCO pricing ceiling catalog
├── processed_data/                    # Active Persistent Storage Hub (Never delete manually)
│   ├── sqlite/                        # procurement_cases.db with all 6 relational tables
│   ├── graph/                         # knowledge_graph.graphml (5,757 nodes) & knowledge_graph.json
│   └── qdrant/                        # Local Qdrant vector collection storage
├── scripts/                           # Operational CLI Runner Tools
│   ├── run_agent_pipeline.py          # End-to-end terminal execution of LangGraph pipeline in INR
│   ├── scrape_vendor_intel.py         # Vendor regulatory due diligence CLI with SQLite caching
│   ├── test_pipeline_run.py           # Diagnostic pipeline test script
│   └── run_all_setup.sh               # Environment setup script
├── app.py                             # Server launch script
└── requirements.txt                   # Locked Python package dependencies
```

---

## 🌐 REST API Endpoints

### Procurement & Intelligence Routes (`/procurement`)
- `POST /procurement/submit` — Submit a new vendor procurement request for autonomous multi-agent audit.
- `GET /procurement/{id}/status` — Poll current pipeline stage (`PLANNING`, `GATHERING_EVIDENCE`, `SCORING_RISK`, `CRITIQUING`, `AWAITING_APPROVAL`, `COMPLETE`).
- `GET /procurement/{id}/report` — Retrieve the finalized `ProcurementReport` with 4D risk scores, contradiction flags, and INR financials.
- `GET /procurement/cases` — List all procurement cases in the relational database.
- `GET /procurement/logs` — Retrieve global governance audit logs across all system activities.
- `GET /procurement/{id}/audit` — Retrieve forensic chronological audit trail for a specific case.
- `GET /procurement/vendors` — Query the 50 registered Indian pharmaceutical vendors directory.
- `GET /procurement/vendors/{vendor_identifier}` — Retrieve specific vendor details, product catalog, and cached risk profile.
- `GET /procurement/pricing-catalog` — List statutory DPCO 2013 pricing reference ceilings and unit formulations in INR.

### Executive Governance & Approval Routes (`/approval`)
- `GET /approval/pending` — List all procurement cases pending executive sign-off.
- `POST /approval/{id}/decide` — Record official sign-off decision (`APPROVED`, `REJECTED`, `ESCALATED`) with audit rationale.

---

## 🚀 Running the Backend

### 1. Build & Seed Databases
The build orchestrator preserves existing database artifacts by default. To populate the SQLite database with the 50 vendors and DPCO 2013 catalog:

```bash
# Seed the relational database with 50 vendors, products, and DPCO catalog
python backend/build/seed_data.py
```

> [!CAUTION]
> Do NOT pass `--force-clean` to `backend/build/build_all.py` unless you explicitly want to re-embed vectors and regenerate the 5,757-node knowledge graph. The system is designed to safely preserve existing datasets in `backend/processed_data/`.

### 2. Start the Development Server
```bash
cd backend
python app.py
# Or: uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive Swagger API Documentation: `http://localhost:8000/docs`
- Alternative ReDoc Interface: `http://localhost:8000/redoc`

### 3. Run Standalone CLI Workflows
```bash
# Run multi-agent audit from the terminal with deal amount in INR:
python backend/scripts/run_agent_pipeline.py --vendor "Apex BioLogistics" --deal 350000

# Perform regulatory due diligence web scraping with database caching:
python backend/scripts/scrape_vendor_intel.py --vendor "Global Pharma Logistics"
```
