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
1. **Planner Agent (`app/agents/planner.py`):** Assesses vendor relationship history and transaction scale to dynamically assign a `LIGHT` (low-value, known supplier) or `FULL` (high-value, new or critical supplier) investigative roadmap.
2. **Executor Agent (`app/agents/executor.py`):** Gathers multi-source evidence across:
   - Persistent relational case ledger (`backend/database/relational/`)
   - Official NPPA DPCO statutory price ceilings (`backend/database/pricing/`)
   - Hybrid RAG (Qdrant vector embeddings + NetworkX property graph)
   - Live external regulatory search & web due diligence (`app/rag/web_scraper.py`)
3. **Risk Scorer Agent (`app/agents/scorer.py`):** Quantifies evidence across 4 distinct dimensions:
   - **Financial Risk:** Liquidity, credit rating, debt-to-equity.
   - **Compliance Risk:** CDSCO Drugs & Cosmetics Act 1940, Schedule M GMP certification, cold chain transit compliance.
   - **Contractual Risk:** Liability caps, indemnity obligations, auto-renewals.
   - **Pricing Risk:** Mathematical comparison against NPPA DPCO statutory ceiling benchmarks.
   - **Confidence Scoring:** Computes an aggregated score adjusted by contradiction penalties.
4. **Critic Agent (`app/agents/critic.py`):** Evaluates evidence completeness and confidence. If confidence is < 0.80 and revisions < 3, instructs the Executor on what additional evidence or clarification to seek.
5. **Report Writer Agent (`app/agents/writer.py`):** Compiles evidence, flagged clauses, contradiction trails, and recommendations into an executive dossier (`ProcurementReport`).

---

## ❓ Architectural Decisions: Why Did We Choose This?

### 1. Why LangGraph over a Monolithic LLM Prompt?
* **Investigative Depth:** Evaluating a pharmaceutical supplier requires sequential dependency: discovering a temperature clause in an SLA immediately requires verifying WHO TRS 1025 guidelines. A single prompt cannot dynamically backtrack or plan new evidence gathering based on mid-flight discoveries.
* **Self-Critique & Error Correction:** The Critic node acts as an automated quality gate, forcing the system to re-investigate when confidence is low rather than guessing.
* **Determinism & Auditability:** State transitions are logged in an immutable state machine, satisfying GxP and regulatory audit requirements.

### 2. Why Hybrid RAG (Qdrant Vector + NetworkX Knowledge Graph)?
* **Dense Vectors (Qdrant):** Outstanding at semantic similarity across unstructured natural language clauses (e.g. finding limitation of liability phrasing regardless of wording).
* **Property Graphs (NetworkX):** Essential for non-Euclidean legal hierarchies. A vector store cannot traverse relationships like:  
  ```
  Drugs and Cosmetics Act 1940 ➔ Schedule M GMP ➔ Form 28D License ➔ Vendor Organization
  ```
* **Dual Retrieval:** By querying both simultaneously, we capture semantic meaning *and* structural regulatory authority.

### 3. Why an Explicit 4-Step Fusion Algorithm with Contradiction Detection?
Standard RAG systems fail when retrieved documents disagree:
* **The Problem:** A vendor SLA states *"Ambient transit permitted at 15°C to 25°C for under 48 hours"*, while WHO TRS 1025 Annex 7 mandates *"Continuous cold chain at 2°C to 8°C"*. A naive LLM summary often blends these into a hallucinated compromise.
* **Our Solution:** The Fusion Engine (`app/rag/fusion.py`):
  1. Normalizes retriever scores to `[0.0, 1.0]`.
  2. Weights scores by document legal priority (e.g. Statute = 1.0, WHO = 0.85, Vendor Draft = 0.60).
  3. Clusters facts by slot and flags direct numerical / condition contradictions.
  4. Penalizes the final confidence score and retains explicit `conflicts_with` pointers for the executive audit report.

### 4. Why Deterministic Pricing Checks against NPPA DPCO?
* In India, selling essential medicines above the DPCO ceiling is a criminal offense under the Essential Commodities Act, 1955.
* LLMs frequently make arithmetic errors with drug unit conversions and dosages. Our Scorer verifies quotes via deterministic mathematics:  
  ```
  excess_amount = max(0.0, quoted_price - ceiling_price)
  ```

### 5. Why SQLite + In-Memory Store for Local POC?
* Enables zero-setup, instant execution out-of-the-box without requiring users to configure external database servers.
* Designed with clean repository abstractions so switching to **PostgreSQL 16+** in production is purely an environment configuration change (`DATA_MODE=production`).

### 6. Why FastAPI?
* Native async architecture for non-blocking LangGraph invocations and web scraping.
* Automatic OpenAPI/Swagger documentation generation at `/docs`.
* Pydantic schemas enforce type safety and seamless camelCase serialization for the React frontend.

---

## 📂 Backend Directory Layout

```
backend/
├── app/
│   ├── main.py                # FastAPI app initialization, CORS, and route mounting
│   ├── config.py              # Environment variables & runtime settings
│   ├── agents/                # LangGraph agent implementations & prompts
│   │   ├── planner.py         # Strategy tiering
│   │   ├── executor.py        # Multi-source evidence gathering
│   │   ├── scorer.py          # 4-dimensional risk scoring
│   │   ├── critic.py          # Quality critique & revision loops
│   │   ├── writer.py          # Executive dossier synthesis
│   │   ├── workflow.py        # StateGraph definition & edge conditions
│   │   └── prompts/           # Specialized system prompts
│   ├── models/                # Pydantic schemas (ProcurementItem, Report, etc.)
│   ├── db/                    # SQLite session store, case ledger, and seed data
│   ├── rag/                   # Fusion engine, Vector store, Graph store, Web scraper
│   └── routers/               # /procurement and /approval API routes
├── build/                     # Master idempotent database build & ingestion engine
│   ├── build_all.py           # Clean & rebuild all 5 database layers
│   ├── database/              # SQLite seeding script
│   ├── rag/                   # Vector chunking & embedding ingestion
│   └── graph/                 # NetworkX property graph builder
├── database/                  # Active persistent storage (relational, vector, graph, pricing, contracts)
├── mock_database/             # Standalone test fixtures & manifests
├── rag_storage/               # Source regulatory PDFs (CDSCO, Schedule M, WHO TRS)
├── scripts/                   # CLI runner scripts (pipeline runner, scraper runner)
├── app.py                     # Entry point runner
└── requirements.txt           # Python dependencies
```

---

## 🚀 Running the Backend

### 1. Build and Seed Databases
```bash
python build/build_all.py
```

### 2. Start the Development Server
```bash
python app.py
# Or: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* Interactive API Documentation: `http://localhost:8000/docs`

### 3. Run Standalone CLI Workflows
```bash
# Run multi-agent pipeline from the terminal
python scripts/run_agent_pipeline.py --vendor "Apex BioLogistics" --deal 350000

# Perform regulatory due diligence web scraping
python scripts/scrape_vendor_intel.py --vendor "Global Pharma Logistics"
```
