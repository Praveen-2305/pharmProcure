# AutonoSource Backend Engine (`backend/`)

The **AutonoSource Backend** is an autonomous, multi-agent investigative platform designed to assess pharmaceutical vendor risks, verify regulatory compliance, audit contract terms, detect legal contradictions, and enforce statutory price ceilings.

---

## 🏗️ Architecture & Pipeline Overview

Rather than relying on single-shot LLM prompts or basic RAG retrieval, the backend orchestrates a team of specialized **LangGraph AI Agents** in a stateful, cyclic workflow:

```
  ┌─────────────────┐       ┌──────────────────┐       ┌─────────────────────┐
  │  Planner Agent  │ ────► │  Executor Agent  │ ────► │  Risk Scorer Agent  │
  └─────────────────┘       └──────────────────┘       └──────────┬──────────┘
                                     ▲                            │
                                     │     Confidence < 0.80      │
                                     │  (Max 3 revision loops)    ▼
                                     └──────────────────── ┌──────────────┐
                                                           │ Critic Agent │
                                                           └──────┬───────┘
                                     Confidence >= 0.80           │
                                     ┌────────────────────────────┘
                                     ▼
                            ┌───────────────────┐       ┌────────────────────┐
                            │   Report Writer   │ ────► │  Human Approval    │
                            │   Agent Synthesis │       │  (/approval/decide)│
                            └───────────────────┘       └────────────────────┘
```

### The 5 Agent Nodes:
1. **Planner Agent (`src/agents/planner.py`):** Assesses vendor relationship history and transaction scale to dynamically assign a `LIGHT` (low-value, known supplier) or `FULL` (high-value, new or critical supplier) investigative roadmap.
2. **Executor Agent (`src/agents/executor.py`):** Gathers multi-source evidence across:
   - Persistent relational case ledger (`processed_data/procurement_cases.db`)
   - Official NPPA DPCO statutory price ceilings (`processed_data/pricing_ceiling_catalog.json`)
   - Hybrid RAG (Qdrant 768-dim Nomic vector embeddings + NetworkX property graph)
   - Live external regulatory search & web due diligence (`src/agents/web_scraper.py`)
3. **Risk Scorer Agent (`src/agents/scorer.py`):** Quantifies evidence across 4 distinct dimensions:
   - **Financial Risk:** Liquidity, credit rating, debt-to-equity.
   - **Compliance Risk:** CDSCO Drugs & Cosmetics Act 1940, Schedule M GMP certification, cold chain transit compliance.
   - **Contractual Risk:** Liability caps, indemnity obligations, auto-renewals.
   - **Pricing Risk:** Mathematical comparison against NPPA DPCO statutory ceiling benchmarks.
   - **Confidence Scoring:** Computes an aggregated score adjusted by contradiction penalties.
4. **Critic Agent (`src/agents/critic.py`):** Evaluates evidence completeness and confidence. If confidence is < 0.80 and revisions < 3, instructs the Executor on what additional evidence or clarification to seek.
5. **Report Writer Agent (`src/agents/writer.py`):** Compiles evidence, flagged clauses, contradiction trails, and recommendations into an executive dossier (`ProcurementReport`).

---

## ❓ Architectural Decisions: Why Did We Choose This?

### 1. Advanced PDF Extraction
* **pymupdf4llm:** Standard PDF extractors destroy tables and legal hierarchy. We utilize `pymupdf4llm` to extract rich Markdown directly from PDFs, giving our LLM perfect structural context for RAG.

### 2. Why Hybrid RAG (Nomic Embeddings + NetworkX Knowledge Graph)?
* **Dense Vectors (Nomic 768-dim):** We utilize `nomic-embed-text-v1.5` for state-of-the-art semantic similarity matching across unstructured legal clauses.
* **Property Graphs (NetworkX):** Essential for non-Euclidean legal hierarchies. A vector store cannot traverse relationships like:  
  ```
  Drugs and Cosmetics Act 1940 ➔ Schedule M GMP ➔ Form 28D License ➔ Vendor Organization
  ```
* **Dual Retrieval:** By querying both simultaneously, we capture semantic meaning *and* structural regulatory authority.

### 3. Why an Explicit 4-Step Fusion Algorithm with Contradiction Detection?
* **Our Solution:** The Fusion Engine (`src/rag_pipeline/fusion.py`) normalizes scores, applies legal priority weighting, clusters facts, and explicitly flags contradictions before passing context to the LLM.

---

## 📂 Backend Directory Layout

```
backend/
├── src/                               # Core Application Runtime (Business Logic)
│   ├── main.py                        # FastAPI application setup, CORS middleware, and route mounting
│   ├── config.py                      # Global environment variable loader (Qdrant URLs, API keys)
│   ├── agents/                        # LangGraph AI agent orchestration implementations
│   │   ├── planner.py                 # Determines the scope (Light vs Full) of the investigation
│   │   ├── executor.py                # Runs the multi-threaded extraction (Web Scrape + Vector + Graph)
│   │   ├── scorer.py                  # Standardizes and normalizes extracted risk facts
│   │   ├── critic.py                  # Resolves contradictions between contracts and regulations
│   │   ├── writer.py                  # Generates the final 4-Dimensional ProcurementReport
│   │   ├── workflow.py                # LangGraph StateGraph compiling all agents into a pipeline
│   │   └── state.py                   # Pydantic state definition for the graph traversal
│   ├── models/                        # Pydantic schemas shared across agents, APIs, and Frontend
│   │   └── schemas.py                 # (ProcurementItem, WorkflowStatus, RiskAssessment, etc.)
│   ├── db/                            # SQLite relational database session and seed logic
│   │   ├── session.py                 # SQLite connection and CaseStore repository layer
│   │   ├── pricing.py                 # API layer connecting to the NPPA DPCO Pricing JSON
│   │   └── seed.py                    # Hardcoded Python definitions for the 5 initial mock cases
│   ├── rag_pipeline/                  # Advanced information retrieval systems
│   │   ├── fusion.py                  # Fuses Vector and Graph results; executes priority weighting
│   │   ├── vector_store.py            # Interfaces with Qdrant for semantic similarity searches
│   │   ├── graph_store.py             # Interfaces with NetworkX for entity relationship queries
│   │   └── web_scraper.py             # Tavily integration to extract live vendor news
│   └── routers/                       # FastAPI REST API controller endpoints
│       ├── procurement.py             # Endpoints: GET /cases, POST /submit, GET /cases/{id}
│       └── approval.py                # Endpoints: GET /pending, POST /cases/{id}/approve
├── build/                             # Master database ingestion and infrastructure creation scripts
│   ├── build_all.py                   # The orchestrator: Purges old DBs and builds all 4 new DBs
│   ├── seed_relational.py             # Dumps the Python objects from src/db/seed.py into SQLite
│   ├── ingest_rag_docs.py             # Chunks Markdown files, embeds with Nomic, uploads to Qdrant
│   └── build_knowledge_graph.py       # Extracts entities/rules from Markdown and creates GraphML
├── data_collected/                    # Stage 1: Raw untidy dump of scraped PDFs and text files
├── mockdata/                          # Stage 2: Valid, clean, perfectly-structured reference examples
├── ingestion/                         # Stage 3: The active inbox folder that build_all.py reads from
├── processed_data/                    # Stage 4: Output Hub containing the finalized generated Databases
│   ├── procurement_cases.db           # (Generated) The SQLite ledger holding all cases
│   ├── vector_embeddings.json         # (Generated) The Qdrant HNSW semantic vector store
│   ├── knowledge_graph.graphml        # (Generated) The NetworkX property graph definition
│   └── pricing_ceiling_catalog.json   # (Generated) The regulatory pricing limits database
├── scripts/                           # Utility Command Line Interface (CLI) runners
│   ├── run_agent_pipeline.py          # Standalone CLI tool to test LangGraph without FastAPI
│   ├── run_all_setup.sh               # Bash script wrapper for initial system setup
│   └── scrape_vendor_intel.py         # Standalone CLI tool to test Tavily scraping
├── app.py                             # Alias script to start the Uvicorn web server easily
└── requirements.txt                   # Locked Python package dependencies (langchain, fastapi, qdrant)
```

---

## 🚀 Running the Backend

### 1. Build and Seed Databases
```bash
python build/build_all.py
```
*(Note: First run will require an internet connection to download the Nomic embedding model weights).*

### 2. Start the Development Server
```bash
python app.py
# Or: uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```
* Interactive API Documentation: `http://localhost:8000/docs`

### 3. Run Standalone CLI Workflows
```bash
# Run multi-agent pipeline from the terminal
python scripts/run_agent_pipeline.py --vendor "Apex BioLogistics" --deal 350000

# Perform regulatory due diligence web scraping
python scripts/scrape_vendor_intel.py --vendor "Global Pharma Logistics"
```
