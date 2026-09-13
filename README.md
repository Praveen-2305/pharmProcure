# AutonoSource — Multi-Agent Procurement Risk & Vendor Intelligence Platform (`pharmProcure`)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/Orchestration-LangGraph-FF6F00?style=flat-square)](https://www.langchain.com/langgraph)
[![Qdrant](https://img.shields.io/badge/Vector_DB-Qdrant-DC2626?style=flat-square&logo=qdrant)](https://qdrant.tech/)
[![NetworkX](https://img.shields.io/badge/Graph_Store-NetworkX-0284C7?style=flat-square)](https://networkx.org/)
[![SQLite](https://img.shields.io/badge/Relational_DB-SQLite_3-003B57?style=flat-square&logo=sqlite)](https://sqlite.org/)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

---

## 📖 The Problem
Procurement evaluation is fundamentally an investigative process, not a simple search task. When an analyst reviews a pharmaceutical vendor, each decision depends on previous findings. Traditional AI solutions (like single-prompt LLMs or basic RAG) fail here because they lack dynamic planning, multi-step evidence collection, and self-critique. Furthermore, standard AI struggles to detect when two regulatory clauses or contract terms explicitly contradict each other (e.g. cold chain temperature tolerances vs statutory transit mandates).

---

## 💡 The Solution (POC v2.0)
AutonoSource transforms vendor evaluation into an intelligent, structured workflow. Instead of relying on a single AI prompt, this platform orchestrates a team of specialized **LangGraph AI Agents** working in parallel and cyclic loops.

The system dynamically investigates vendors across four core risk dimensions:
1. **Financial Risk** (Audited balance sheets, credit scores, debt-to-equity ratios)
2. **Compliance Risk** (CDSCO Drugs & Cosmetics Act 1940, Schedule M GMP certifications, WHO TRS 1025 cold chain rules, FDA 483 citations)
3. **Contractual Risk** (Liability caps, auto-renewal terms, indemnification clauses, termination notice periods)
4. **Pricing Risk** (Deterministic verification of vendor quotes against statutory ceiling prices under NPPA/DPCO 2013 denominated strictly in Indian Rupees — INR / ₹)

---

## 🏗️ Architectural Innovation: Hybrid RAG & Contradiction Resolution
The core technological differentiator of this platform is how it handles unstructured contracts and regulatory documents. It runs dual retrievers in parallel:
- **Vector RAG (Qdrant):** Finds relevant contract clauses and regulatory provisions via high-performance semantic vector similarity (768-dimensional dense Nomic embeddings).
- **Graph RAG (NetworkX Property Graph):** Traverses a 5,757-node property graph of legal entities, statutory rules, licenses, and regulatory dependencies.

### ⚡ The 4-Step Fusion Mechanism:
If the Vector and Graph retrievers return conflicting information, the system executes an explicit 4-step fusion algorithm:
1. **Score Normalization:** Scales retriever similarity & path scores to `[0.0, 1.0]`.
2. **Source Weighting:** Multiplies scores by document priority (`weighted_score = score * source_priority`).
3. **Contradiction Detection:** Clusters facts by query-slot and detects numeric or term conflicts (e.g. ambient 15°C–25°C transit vs statutory 2°C–8°C cold chain).
4. **Confidence Penalty:** Computes `overall_confidence = base_confidence * (1 - contradiction_penalty)`, retaining runner-up facts with explicit `conflicts_with` pointers.

---

## 🤖 The Multi-Agent Workflow (LangGraph)

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

1. **Planner Agent ([`planner.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/planner.py)):** Evaluates vendor profile, historical relationship, and deal size to establish a `LIGHT` (< ₹5,00,000) or `FULL` (≥ ₹5,00,000) strategy via [`planner_prompt.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/prompts/planner_prompt.py).
2. **RAG Agent ([`rag_agent.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/rag_agent.py)):** Coordinates vector retrieval (Qdrant) and graph retrieval (5,757-node NetworkX property graph), executing the 4-step fusion algorithm with contradiction detection.
3. **Scraper Agent ([`scraper_agent.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/scraper_agent.py)):** Queries verified financials from the 50 registered vendors in SQLite, verifies quotes against DPCO 2013 ceiling rates in INR, crawls external regulatory alerts via [`web_scraper.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/web_scraper.py), and caches profiles in the database.
4. **Risk Scorer Agent ([`scorer.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/scorer.py)):** Evaluates evidence across the 4 risk dimensions in INR using [`scorer_prompt.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/prompts/scorer_prompt.py) and computes an aggregated **Confidence Score**.
5. **Critic Agent ([`critic.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/critic.py)):** Reviews evidence completeness against the 0.80 threshold. If confidence is < 0.80 and revision count < 3, triggers a targeted revision loop for the RAG and Scraper nodes.
6. **Report Writer Agent ([`writer.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/writer.py)):** Compiles findings, flagged clauses, contradiction trails, and recommendations into an executive dossier in INR via [`writer_prompt.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/prompts/writer_prompt.py).
7. **Human-in-the-Loop (`/approval/*`):** Presents recommendations to a human procurement officer for final review (`APPROVED`, `REJECTED`, or `ESCALATED`).

---

## 🛠️ Implemented Technology Stack

### Backend Engine (`backend/`)
- **Framework:** FastAPI & Uvicorn ([`src/main.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/main.py))
- **AI Orchestration:** LangGraph & LangChain ([`src/agents/workflow.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/workflow.py))
- **Prompt Architecture:** Dedicated prompts module ([`src/prompts/`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/prompts/)) with INR standards
- **Vector Store:** Local Qdrant Database ([`processed_data/qdrant/`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/processed_data/qdrant/))
- **Graph Store:** NetworkX Property Graph with 5,757 nodes ([`processed_data/graph/knowledge_graph.graphml`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/processed_data/graph/knowledge_graph.graphml))
- **Relational Storage:** SQLite 3 ([`processed_data/sqlite/procurement_cases.db`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/processed_data/sqlite/procurement_cases.db)) hosting 6 tables: `vendors`, `vendor_products`, `pricing_references`, `procurement_cases`, `audit_logs`, and `vendor_profiles`
- **Build Engine:** Master build orchestrator ([`build/build_all.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/build/build_all.py)) and seeder ([`build/seed_data.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/build/seed_data.py))
- **Regulatory Due Diligence:** Multi-source web scraper ([`src/agents/web_scraper.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/agents/web_scraper.py))

### Frontend Dashboard (`frontend/`)
- **Framework:** React 18 with TypeScript & Vite
- **Styling:** Tailwind CSS & Glassmorphism design tokens
- **Animations:** Framer Motion (60fps micro-transitions)
- **UI Components:** Dedicated `ConfidenceBadge`, `ContradictionFlag`, `RiskLevelTag`, and `ApprovalModal` components

---

## 📂 Project Structure

```
procurement-agent/
├── backend/
│   ├── src/                               # Application Core Logic & Runtime
│   │   ├── main.py                        # FastAPI application entry point, CORS, & root discovery
│   │   ├── config.py                      # Global environment configuration (Qdrant path, API keys)
│   │   ├── agents/                        # LangGraph agent implementations
│   │   │   ├── planner.py                 # Evaluates deal size in INR and selects LIGHT vs FULL strategy
│   │   │   ├── rag_agent.py               # Coordinates dual vector and 5,757-node graph retrieval
│   │   │   ├── scraper_agent.py           # Queries SQLite vendor profiles and external regulatory intel
│   │   │   ├── web_scraper.py             # Tavily due diligence search with rule-based regex fallback
│   │   │   ├── scorer.py                  # 4D risk scoring rubric & confidence calculation in INR
│   │   │   ├── critic.py                  # Quality critique & contradiction resolution revision loop
│   │   │   ├── writer.py                  # Executive dossier synthesis in INR
│   │   │   ├── workflow.py                # LangGraph StateGraph compiling all agent nodes
│   │   │   └── state.py                   # Pydantic WorkflowState schema definition
│   │   ├── prompts/                       # Modular prompt templates enforcing INR & Indian regulations
│   │   │   ├── __init__.py                # Clean prompt exports
│   │   │   ├── planner_prompt.py          # LIGHT vs FULL threshold logic (₹5,00,000 threshold)
│   │   │   ├── scraper_prompt.py          # Regulatory compliance & adverse search criteria
│   │   │   ├── scorer_prompt.py           # 4-dimensional risk scoring rubric
│   │   │   ├── critic_prompt.py           # Self-reflection & audit loop prompt
│   │   │   └── writer_prompt.py           # Executive report schema in INR
│   │   ├── models/                        # Pydantic schemas (ProcurementItem, RiskAssessment, etc.)
│   │   ├── db/                            # SQLite session store & pricing service
│   │   │   ├── session.py                 # Thread-safe CaseStore supporting all 6 relational tables
│   │   │   ├── pricing.py                 # Connects to SQLite pricing_references with JSON fallback
│   │   │   └── seed.py                    # Seed definitions for baseline procurement cases
│   │   ├── rag_pipeline/                  # Advanced information retrieval systems
│   │   │   ├── fusion.py                  # 4-step score normalization, weighting, and contradiction resolution
│   │   │   ├── vector_store.py            # Direct Qdrant client reading from processed_data/qdrant/
│   │   │   ├── graph_store.py             # Multi-tier node matching across the 5,757-node property graph
│   │   │   └── web_scraper.py             # Web scraper module alias for backward compatibility
│   │   └── routers/                       # FastAPI REST API controller endpoints
│   │       ├── procurement.py             # Case submission, status, reports, audit logs, vendors, pricing catalog
│   │       └── approval.py                # Executive review queue and sign-off decisions
│   ├── build/                             # Database Ingestion & Build Automation
│   │   ├── build_all.py                   # Master builder (preserves existing datasets unless rebuild requested)
│   │   ├── seed_data.py                   # Ingests 50 vendors, products, and DPCO catalog into SQLite
│   │   ├── ingest_rag_docs.py             # Chunks regulatory documents & embeds into Qdrant vector store
│   │   ├── build_knowledge_graph.py       # Compiles regulatory ontology into NetworkX GraphML
│   │   ├── graph/                         # Knowledge graph construction tools (Groq multi-key pipeline)
│   │   └── README.md                      # Detailed build guide and safety instructions
│   ├── ingestion/                         # Canonical Data Ingestion Sources
│   │   ├── rag_and_graph/                 # Regulatory Acts (CDSCO, DPCO 2013, Schedule M, WHO TRS 1025)
│   │   └── sql/                           # 50 Indian vendors directory & statutory DPCO pricing ceiling catalog
│   ├── processed_data/                    # Active Persistent Storage Hub (Never delete manually)
│   │   ├── sqlite/                        # procurement_cases.db with all 6 relational tables
│   │   ├── graph/                         # knowledge_graph.graphml (5,757 nodes) & knowledge_graph.json
│   │   └── qdrant/                        # Local Qdrant vector collection storage
│   ├── scripts/                           # Operational CLI Runner Tools
│   │   ├── run_agent_pipeline.py          # End-to-end terminal execution of LangGraph pipeline in INR
│   │   ├── scrape_vendor_intel.py         # Vendor regulatory due diligence CLI with SQLite caching
│   │   ├── test_pipeline_run.py           # Diagnostic pipeline test script
│   │   └── run_all_setup.sh               # Environment setup script
│   ├── app.py                             # Server launch script
│   └── requirements.txt                   # Locked Python package dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                           # Typed client endpoints (procurement.ts, approval.ts, types.ts)
│   │   ├── pages/                         # Landing, Dashboard, SubmitRequest, VendorReview, ApprovalQueue
│   │   ├── components/                    # ConfidenceBadge, ContradictionFlag, RiskLevelTag, Layout
│   │   └── router.tsx                     # React Router DOM configuration
│   └── package.json
└── project_information/                   # Numbered Agent & Developer Onboarding Suite
    ├── README.md                          # Documentation index & reading sequence guide
    ├── 01_PROJECT_OVERVIEW_AND_POC_FOUNDATIONS.md
    ├── 02_MULTI_AGENT_WORKFLOW_AND_PROMPTS.md
    ├── 03_HYBRID_RAG_CONTRADICTION_AND_WEB_SCRAPING.md
    ├── 04_DATABASE_ARCHITECTURE_AND_BUILD_SYSTEM.md
    ├── 05_REST_API_AND_FRONTEND_SPECIFICATION.md
    ├── 06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md
    └── 07_LLM_AGENT_HANDOFF_CONTEXT.md
```

---

## 🚀 Quick Start & Local Setup

### 1. Seed the Relational Database
Populate SQLite with the 50 Indian pharmaceutical vendors, product catalog, and DPCO 2013 price ceilings:

```bash
python backend/build/seed_data.py
```

### 2. Run the FastAPI Backend Server
```bash
cd backend
python app.py
# Or: uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend runs on `http://localhost:8000`. Interactive Swagger API Docs are available at `http://localhost:8000/docs`.*

### 3. Run the React Frontend Dashboard
```bash
cd frontend
pnpm install
pnpm run dev
```
*Frontend runs on `http://localhost:5173`.*

### 4. Run Single-Audit via CLI
Test the multi-agent pipeline or regulatory web intelligence due diligence directly in your terminal:

```bash
# Run full multi-agent audit on a vendor with deal amount in INR:
python backend/scripts/run_agent_pipeline.py --vendor "Apex BioLogistics" --deal 350000

# Perform regulatory web intelligence due diligence:
python backend/scripts/scrape_vendor_intel.py --vendor "Global Pharma Logistics"
```

---

## 📚 Comprehensive Documentation Suite

For detailed architectural specifications, mathematical fusion algorithms, agent prompt templates, and database schemas, consult the numbered documentation suite in [`project_information/`](project_information/):

| Document | Topic & Focus Area |
| :--- | :--- |
| 📖 [**`README.md`**](project_information/README.md) | Onboarding guide, reading order, and quick reference for incoming AI agents and developers. |
| 📋 [**`01_PROJECT_OVERVIEW_AND_POC_FOUNDATIONS.md`**](project_information/01_PROJECT_OVERVIEW_AND_POC_FOUNDATIONS.md) | Business context, problem statement, CDSCO Drugs & Cosmetics Act 1940, Schedule M GMP, and DPCO 2013 foundations. |
| 🤖 [**`02_MULTI_AGENT_WORKFLOW_AND_PROMPTS.md`**](project_information/02_MULTI_AGENT_WORKFLOW_AND_PROMPTS.md) | LangGraph StateGraph, the specialized agent nodes, conditional routing, revision loops, and system prompt templates. |
| ⚡ [**`03_HYBRID_RAG_CONTRADICTION_AND_WEB_SCRAPING.md`**](project_information/03_HYBRID_RAG_CONTRADICTION_AND_WEB_SCRAPING.md) | Dual-retriever architecture (Qdrant + NetworkX), 4-step fusion algorithm, pricing ceiling checks, and web scraper due diligence. |
| 🗄️ [**`04_DATABASE_ARCHITECTURE_AND_BUILD_SYSTEM.md`**](project_information/04_DATABASE_ARCHITECTURE_AND_BUILD_SYSTEM.md) | The database subsystems under `backend/processed_data/` and the master idempotent `build_all.py` engine. |
| 🎨 [**`05_REST_API_AND_FRONTEND_SPECIFICATION.md`**](project_information/05_REST_API_AND_FRONTEND_SPECIFICATION.md) | Full REST API specification (`/procurement/*`, `/approval/*`), camelCase JSON schemas, and React UI layout. |
| 🔄 [**`06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md`**](project_information/06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md) | **Mock to Original Production Data Plan**: Migration roadmap for PostgreSQL, Qdrant Cloud, Neo4j, live NPPA gazettes, and CLM integrations. |
| 🧭 [**`07_LLM_AGENT_HANDOFF_CONTEXT.md`**](project_information/07_LLM_AGENT_HANDOFF_CONTEXT.md) | **LLM Handoff Guide**: Technical constraints, path rules, and resumption guide for AI agents. |
