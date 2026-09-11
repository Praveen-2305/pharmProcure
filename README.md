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
Procurement evaluation is fundamentally an investigative process, not a simple search task. When an analyst reviews a vendor, each decision depends on previous findings. Traditional AI solutions (like single-prompt LLMs or basic RAG) fail here because they lack dynamic planning, multi-step evidence collection, and self-critique. Furthermore, standard AI struggles to detect when two regulatory clauses or contract terms explicitly contradict each other.

---

## 💡 The Solution (POC v2.0)
AutonoSource transforms vendor evaluation into an intelligent, structured workflow. Instead of relying on a single AI prompt, this platform orchestrates a team of specialized **LangGraph AI Agents** working together in a stateful pipeline.

The system dynamically investigates vendors across four core risk dimensions:
1. **Financial Risk** (Audited balance sheets, credit scores, debt-to-equity ratios)
2. **Compliance Risk** (CDSCO Drugs & Cosmetics Act 1940, Schedule M GMP certifications, WHO TRS 1025 cold chain rules, FDA 483 citations)
3. **Contractual Risk** (Liability caps, auto-renewal terms, indemnification clauses, termination notice periods)
4. **Pricing Risk** (Deterministic verification of vendor quotes against statutory ceiling prices, e.g., NPPA/DPCO 2013 ceiling benchmark catalog)

---

## 🏗️ Architectural Innovation: Hybrid RAG & Contradiction Resolution
The core technological differentiator of this platform is how it handles unstructured contracts and regulatory documents. It runs two retrievers in parallel:
- **Vector RAG (Qdrant):** Finds relevant contract clauses via high-performance semantic vector similarity (384-dimensional dense embeddings).
- **Graph RAG (NetworkX Property Graph):** Traverses a multi-entity property graph of legal entities, obligations, licenses, and regulatory relationships.

### ⚡ The 4-Step Fusion Mechanism:
If the Vector and Graph retrievers return conflicting information, the system does *not* hallucinate or silently guess. It executes an explicit 4-step fusion algorithm:
1. **Score Normalization:** Scales retriever similarity & path scores to `[0.0, 1.0]`.
2. **Source Weighting:** Multiplies scores by document priority (`weighted_score = score * source_priority`).
3. **Contradiction Detection:** Clusters facts by query-slot and detects numeric or term conflicts (e.g. ambient 15°C–25°C transit vs statutory 2°C–8°C cold chain).
4. **Confidence Penalty:** Computes `overall_confidence = base_confidence * (1 - contradiction_penalty)`, retaining runner-up facts with explicit `conflicts_with` pointers.

---

## 🤖 The Multi-Agent Workflow (LangGraph)

```
 [Planner Agent] ---> [Executor Agent] ---> [Risk Scorer Agent] ---> [Critic Agent] ---> [Report Writer] ---> [Human Approval]
                            ^                                             |
                            +---------------------------------------------+
                                     (Loop if Confidence < 0.80)
```

1. **Planner Agent (`planner.py`):** Evaluates vendor profile, historical relationship, and deal size to establish a `LIGHT` or `FULL` investigation strategy.
2. **Executor Agent (`executor.py`):** Gathers multi-source evidence across:
   - Relational case ledger (SQLite database)
   - Statutory NPPA DPCO price ceiling catalog
   - Hybrid RAG (Qdrant vector store + NetworkX property graph)
   - External web due diligence (`web_scraper.py` checking CDSCO, FDA warning letters, and MCA court records)
3. **Risk Scorer Agent (`scorer.py`):** Evaluates evidence across the 4 risk dimensions, applies statutory pricing variance checks, incorporates adverse regulatory citations, and computes a unified **Confidence Score**.
4. **Critic Agent (`critic.py`):** Reviews evidence completeness. If confidence is < 0.80 and revision_count < 3, triggers a targeted revision loop with updated investigation instructions for the Executor.
5. **Report Writer Agent (`writer.py`):** Compiles findings, flagged clauses, contradiction trails, and recommendations into a structured executive report.
6. **Human-in-the-Loop (`/approval/*`):** Presents recommendations to a human procurement officer for final review (`APPROVED`, `REJECTED`, or `ESCALATED`).

---

## 🛠️ Implemented Technology Stack

### Backend Engine (`backend/`)
- **Framework:** FastAPI & Uvicorn (`app/main.py`)
- **AI Orchestration:** LangGraph & LangChain (`app/agents/workflow.py`)
- **LLM Reasoning:** Google Gemini
- **Vector Store:** Qdrant Database (`app/rag/vector_store.py`, `app/rag/embedding_pipeline.py`)
- **Graph Store:** NetworkX Property Graph (`app/rag/graph_store.py`, GraphML + JSON ontology)
- **Relational Storage:** SQLite 3 (`backend/database/relational/procurement_cases.db`) & thread-safe in-memory `CaseStore` (`app/db/session.py`)
- **Idempotent Build Engine:** Master build pipeline (`backend/build/build_all.py`) rebuilding all 5 storage layers
- **Regulatory Due Diligence:** Multi-source web scraper (`app/rag/web_scraper.py`)

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
│   ├── app/
│   │   ├── main.py                     # FastAPI application entry point & CORS configuration
│   │   ├── config.py                   # System configuration & environment settings
│   │   ├── agents/                     # LangGraph agent implementations
│   │   │   ├── planner.py              # Vendor tiering & strategy planning
│   │   │   ├── executor.py             # Multi-source evidence gathering
│   │   │   ├── scorer.py               # 4-dimensional risk scoring & confidence computation
│   │   │   ├── critic.py               # Quality critique & revision loop control
│   │   │   ├── writer.py               # Executive report synthesis
│   │   │   ├── workflow.py             # LangGraph StateGraph & conditional routing
│   │   │   └── prompts/                # Modular system prompts for all 5 agents
│   │   ├── models/                     # Pydantic domain models (camelCase serialization)
│   │   ├── db/                         # Session store, SQLite persistence, and pricing reference
│   │   ├── rag/                        # Fusion Engine, Vector Store, Graph Store, Web Scraper
│   │   └── routers/                    # /procurement and /approval REST API routes
│   ├── build/                          # Idempotent database build and ingestion pipelines
│   │   ├── build_all.py                # Master builder for all 5 database layers
│   │   ├── run_build.py                # Master build orchestrator wrapper
│   │   ├── database/                   # SQLite table & case ledger seeding
│   │   ├── rag/                        # Regulatory PDF & SLA contract vector ingestion
│   │   └── graph/                      # NetworkX knowledge graph generator
│   ├── database/                       # Active persistent storage layers (generated by build_all.py)
│   │   ├── relational/                 # SQLite procurement_cases.db & cases.json
│   │   ├── vector/                     # Dense 384-dim vector embeddings & collection metadata
│   │   ├── graph/                      # NetworkX knowledge_graph.graphml & JSON
│   │   ├── pricing/                    # NPPA DPCO 2013 statutory price ceilings
│   │   └── contracts/                  # Active SLA contracts and master agreements
│   ├── mock_database/                  # Standalone reference test datasets & manifests
│   │   ├── cases/                      # Pre-seeded test cases & baseline cases.json
│   │   ├── contracts/                  # Contract SLAs (Apex, Nova, Global Pharma)
│   │   ├── graph/                      # Entity ontology & relations (entities_and_relations.json)
│   │   ├── pricing/                    # Official DPCO ceiling benchmarks
│   │   └── vector/                     # Sample vector points and payloads
│   ├── rag_storage/                    # Verified regulatory PDFs & reference benchmarks
│   │   ├── drug_regulations/           # Drugs & Cosmetics Act 1940 & GDP Guidelines
│   │   ├── drugs/                      # State Licensing Authorities Directory
│   │   ├── gmp/                        # Schedule M (Good Manufacturing Practices)
│   │   ├── storage/                    # WHO TRS 1025 Annex 7 (Cold-chain transit)
│   │   ├── pricing/                    # NPPA DPCO statutory ceiling price dataset
│   │   └── contracts/                  # Sample pharmaceutical Master Services Agreements
│   ├── scripts/                        # Operational CLI runner tools
│   │   ├── run_agent_pipeline.py       # End-to-end terminal execution of LangGraph pipeline
│   │   ├── scrape_vendor_intel.py      # Vendor regulatory & adverse search CLI tool
│   │   └── run_all_setup.sh            # Automated environment initialization script
│   ├── app.py                          # Top-level server entry point
│   └── requirements.txt                # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                        # Typed client endpoints (procurement.ts, approval.ts, types.ts)
│   │   ├── pages/                      # Landing, Dashboard, SubmitRequest, VendorReview, ApprovalQueue
│   │   ├── components/                 # ConfidenceBadge, ContradictionFlag, RiskLevelTag, Layout
│   │   └── router.tsx                  # React Router DOM configuration
│   └── package.json
└── project_information/                # Numbered Agent & Developer Onboarding Suite
    ├── README.md                       # Documentation index & reading sequence guide
    ├── 01_PROJECT_OVERVIEW_AND_POC_FOUNDATIONS.md
    ├── 02_MULTI_AGENT_WORKFLOW_AND_PROMPTS.md
    ├── 03_HYBRID_RAG_CONTRADICTION_AND_WEB_SCRAPING.md
    ├── 04_DATABASE_ARCHITECTURE_AND_BUILD_SYSTEM.md
    ├── 05_REST_API_AND_FRONTEND_SPECIFICATION.md
    └── 06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md
```

---

## 🔄 Mock to Production Data Migration Roadmap

While the POC runs self-contained using deterministic local fixtures (SQLite, in-memory Qdrant, NetworkX, and curated DPCO benchmarks), the platform is architected with an explicit **4-Phase Production Evolution Blueprint**:

1. **Relational Database:** SQLite ➔ **PostgreSQL 16+** with PgBouncer connection pooling and GxP 21 CFR Part 11 append-only audit ledgers.
2. **Vector Store:** Local Qdrant ➔ **Distributed Qdrant Cloud Cluster** / Milvus with automated OCR contract chunking via AWS Textract.
3. **Knowledge Graph:** NetworkX ➔ **Neo4j Enterprise Cluster** executing high-throughput Cypher path traversal queries.
4. **Pricing Catalog:** Curated JSON ➔ **Live ETL Crawler** syncing official NPPA DPCO Gazette notices and SAP/Oracle ERP pricing masters.
5. **Contract Ingestion:** Local Markdown ➔ **Enterprise CLM Webhooks** (Icertis, DocuSign CLM, Ironclad, SAP Ariba).
6. **Due Diligence:** Heuristic search ➔ **Official Enterprise APIs** (Ministry of Corporate Affairs MCA21, openFDA Warning Letters, e-Courts NJDG).

👉 **For the complete architecture, codebase adapter patterns, and 12-week execution schedule, consult:**  
[**`project_information/06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md`**](project_information/06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md)

---

## 🚀 Quick Start & Local Setup

### 1. Rebuild and Seed All Databases
Before running the backend for the first time, execute the master idempotent build command to initialize all 5 database layers:

```bash
# From the root repository directory
python backend/build/build_all.py
```

### 2. Run the FastAPI Backend Server
```bash
# From the root project directory
cd backend
python app.py
# Or: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend runs on `http://localhost:8000`. Interactive Swagger API Docs are available at `http://localhost:8000/docs`.*

### 3. Run the React Frontend Dashboard
```bash
# Open a new terminal in the frontend directory
cd frontend
pnpm install
pnpm run dev
```
*Frontend runs on `http://localhost:5173`.*

### 4. Run Single-Audit via CLI
You can test the entire autonomous agent pipeline or the live regulatory web scraper directly in your terminal:

```bash
# Run full multi-agent audit on a vendor
python backend/scripts/run_agent_pipeline.py --vendor "Apex BioLogistics" --deal 350000

# Perform regulatory web intelligence due diligence
python backend/scripts/scrape_vendor_intel.py --vendor "Global Pharma Logistics"
```

---

## 📚 Comprehensive Documentation Suite

For detailed architectural specifications, mathematical fusion algorithms, agent prompt templates, and database schemas, consult the numbered documentation suite in [`project_information/`](project_information/):

| Document | Topic & Focus Area |
| :--- | :--- |
| 📖 [**`README.md`**](project_information/README.md) | Onboarding guide, reading order, and quick reference for incoming AI agents and developers. |
| 📋 [**`01_PROJECT_OVERVIEW_AND_POC_FOUNDATIONS.md`**](project_information/01_PROJECT_OVERVIEW_AND_POC_FOUNDATIONS.md) | Business context, problem statement, CDSCO Drugs & Cosmetics Act 1940, Schedule M GMP, and DPCO 2013 foundations. |
| 🤖 [**`02_MULTI_AGENT_WORKFLOW_AND_PROMPTS.md`**](project_information/02_MULTI_AGENT_WORKFLOW_AND_PROMPTS.md) | LangGraph StateGraph, the 5 agent nodes, conditional routing, revision loops, and system prompt templates. |
| ⚡ [**`03_HYBRID_RAG_CONTRADICTION_AND_WEB_SCRAPING.md`**](project_information/03_HYBRID_RAG_CONTRADICTION_AND_WEB_SCRAPING.md) | Dual-retriever architecture (Qdrant + NetworkX), 4-step fusion algorithm, pricing ceiling checks, and web scraper due diligence. |
| 🗄️ [**`04_DATABASE_ARCHITECTURE_AND_BUILD_SYSTEM.md`**](project_information/04_DATABASE_ARCHITECTURE_AND_BUILD_SYSTEM.md) | The 5 database subsystems under `backend/database/` and the master idempotent `build_all.py` engine. |
| 🎨 [**`05_REST_API_AND_FRONTEND_SPECIFICATION.md`**](project_information/05_REST_API_AND_FRONTEND_SPECIFICATION.md) | Full REST API specification (`/procurement/*`, `/approval/*`), camelCase JSON schemas, and React UI layout. |
| 🔄 [**`06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md`**](project_information/06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md) | **Mock to Original Production Data Plan**: Migration roadmap for PostgreSQL, Qdrant Cloud, Neo4j, live NPPA gazettes, and CLM integrations. |

