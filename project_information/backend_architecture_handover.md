# AutonoSource — Backend Architecture & Technical Handover Documentation (POC v2.0)

**Document Version:** 2.0.0  
**Project:** AutonoSource — Multi-Agent Procurement Risk & Vendor Intelligence Platform (`pharmProcure`)  
**Target Audience:** Antigravity AI Assistant, Engineering Team, System Architects  

---

## 1. Executive Summary

This document provides a comprehensive technical reference for the **AutonoSource Backend Engine**. The backend is implemented as a stateful, multi-agent workflow powered by **LangGraph**, **FastAPI**, **Qdrant Vector Database**, **NetworkX Property Graph Store**, and **Google Gemini LLM** integrations.

It transforms manual vendor procurement evaluation into an automated, evidence-driven, 4D risk auditing pipeline featuring a self-validating Critic Agent and human-in-the-loop governance.

---

## 2. Directory Structure & File Map

The backend follows an enterprise modular directory pattern:

```
backend/
├── app/
│   ├── __init__.py             # App package initializer
│   ├── main.py                 # FastAPI Application Entry Point & Middleware
│   ├── api/
│   │   ├── __init__.py         # API router initializer
│   │   └── procurement.py      # REST API endpoints for procurement workflows & queue
│   └── core/
│       ├── __init__.py         # Core package initializer
│       └── config.py           # Application settings & environment variables
├── agents/                     # Specialized LangGraph Agent Node Implementations
│   ├── __init__.py
│   ├── planner.py              # Planner Agent: Strategic investigation depth selection
│   ├── executor.py             # Executor Agent: Multi-source evidence collection
│   ├── scorer.py               # Risk Scorer Agent: 4D risk evaluation & confidence computation
│   ├── critic.py               # Critic Agent: Self-validation & feedback loop thresholding
│   └── reporter.py             # Report Writer Agent: Audit report & rationale synthesis
├── rag/                        # Hybrid RAG & Knowledge Graph Engine
│   ├── __init__.py
│   ├── vector_store.py         # Qdrant Vector Store Retriever (In-memory / Host)
│   ├── graph_store.py          # NetworkX Property Graph Store (Entity-relationship traversal)
│   ├── fusion.py               # 4-Step Fusion & Contradiction Resolution Engine
│   └── hybrid_retriever.py     # Orchestrated Parallel Hybrid Retriever
├── workflow/                   # LangGraph State & Pipeline Mechanics
│   ├── __init__.py
│   ├── state.py                # WorkflowState & Pydantic Data Models (4D Risk, Contradictions)
│   └── graph.py                # LangGraph StateGraph builder with conditional edge logic
├── app.py                      # Top-level server proxy entry point (`uvicorn app.main:app`)
└── requirements.txt            # Python dependencies (FastAPI, LangGraph, Qdrant, NetworkX)
```

---

## 3. Core Architectural Modules

### 3.1 Multi-Agent Pipeline (`backend/workflow/graph.py` & `backend/agents/`)

The workflow is managed as a stateful `StateGraph` in LangGraph with 5 dedicated agent nodes:

```
                   +-------------------+
                   |   Planner Agent   |
                   +---------+---------+
                             |
                             v
                   +-------------------+
            +----->|  Executor Agent   |
            |      +---------+---------+
            |                |
            |                v
     (Loop if      +-------------------+
  confidence < 0.8 | Risk Scorer Agent |
  & rev < 3)       +---------+---------+
            |                |
            |                v
            |      +-------------------+
            +------+   Critic Agent    |
                   +---------+---------+
                             | (Approved)
                             v
                   +-------------------+
                   | Report Writer Agt |
                   +---------+---------+
                             |
                             v
                   +-------------------+
                   | Human-in-the-Loop |
                   +-------------------+
```

1. **Planner Agent (`backend/agents/planner.py`):**
   - Analyzes request parameters (Deal Size, Product Category).
   - Assigns investigation depth: `LIGHT` (low deal size) vs. `FULL` (high value >= $100,000 or regulated pharmaceutical category).

2. **Executor Agent (`backend/agents/executor.py`):**
   - Collects evidence across 4 distinct sources:
     - **Structured Data:** Vendor financial audits, credit score, FDA 483 citations, ISO certifications (MongoDB).
     - **Regulated Pricing Index:** NPPA/DPCO ceiling reference price lookup.
     - **Unstructured Documents:** Hybrid RAG retrieval over contract clauses and regulations.
     - **External Intelligence:** Tavily search API integration for litigation news & public records.

3. **Risk Scorer Agent (`backend/agents/scorer.py`):**
   - Computes 4D Risk Metrics:
     - **Financial Risk:** Evaluates credit scores & financial audit status (`LOW`, `MEDIUM`, `HIGH`).
     - **Compliance Risk:** Checks FDA 483 citations & regulatory compliance (`LOW`, `MEDIUM`, `HIGH`).
     - **Contractual Risk:** Evaluates clause liabilities and contradiction flags (`LOW`, `MEDIUM`, `HIGH`).
     - **Pricing Risk:** Compares quoted prices against regulated ceiling prices (`WITHIN_CEILING`, `EXCEEDS_CEILING`, `INDETERMINATE`).
   - Calculates unified `confidence_score` and populates `contradiction_flags`.

4. **Critic Agent (`backend/agents/critic.py`):**
   - Self-validates confidence scores against a `0.80` threshold.
   - If `confidence < 0.80` and `revision_count < 3`, triggers a feedback loop back to the Executor Node for additional evidence.
   - Otherwise, approves the assessment for report generation.

5. **Report Writer Agent (`backend/agents/reporter.py`):**
   - Synthesizes findings into a structured executive report featuring clear rationales, flagged clauses, pricing compliance checks, and contradiction trails.

---

### 3.2 Hybrid RAG Engine & Contradiction Resolution (`backend/rag/` & `backend/workflow/fusion.py`)

AutonoSource combines **Vector RAG** and **Graph RAG** in parallel to eliminate hallucinations and detect regulatory contradictions:

#### Component Breakdown:
* **Vector Store (`vector_store.py`):** Integrates `qdrant-client` to perform semantic vector search over contract embeddings using Cosine similarity.
* **Graph Store (`graph_store.py`):** Uses NetworkX `MultiDiGraph` to store legal entities, obligations, and contract constraints. Computes `graph_score = 1 / (1 + shortest_path_length)`.
* **Fusion & Contradiction Engine (`fusion.py`):**
  - **Step 1:** Normalizes vector and graph scores to `[0, 1]`.
  - **Step 2:** Applies source priority weighting (`weighted_score = raw_score * source_priority`).
  - **Step 3:** Detects contradictions by clustering query-slot facts. Disagreements are explicitly retained with a `conflicts_with` pointer rather than dropped.
  - **Step 4:** Calculates `final_confidence = base_confidence * (1 - contradiction_penalty)`.

---

## 4. REST API Specification (`backend/app/api/procurement.py`)

The FastAPI server exposes 4 primary REST endpoints for integration with the React dashboard:

| Method | Endpoint | Description | Request Body / Query |
|---|---|---|---|
| `GET` | `/` | System health check & active agent/database configuration | None |
| `POST` | `/api/procurement/run` | Triggers multi-agent audit pipeline | `{ vendor_name, deal_size, procurement_details, category, quoted_unit_price }` |
| `GET` | `/api/procurement/queue` | Returns active audit queue for executive dashboard | None |
| `GET` | `/api/procurement/{id}` | Fetches full 4D risk report, evidence bundle, & contradiction flags | `procurement_id` path param |
| `POST` | `/api/procurement/{id}/approve` | Records Human-in-the-Loop decision | `{ decision: "APPROVED" | "REJECTED" | "ESCALATED", notes, reviewer_id }` |

---

## 5. Execution & Verification

### Running the Backend Server locally:
```bash
cd backend
python app.py
```
*Server starts at `http://localhost:8000`. API documentation is accessible at `http://localhost:8000/docs`.*

### Verification Command:
```bash
python -c "import sys; sys.path.insert(0, 'backend'); from app.main import app; print('App initialized successfully!')"
```

---

## 6. Summary of Handover Status

- [x] **LangGraph StateGraph Engine:** Complete & operational with 5 agent nodes.
- [x] **Qdrant Vector Database Integration:** Complete with `:memory:` fallback mode.
- [x] **NetworkX Property Graph Store:** Complete with entity traversal.
- [x] **Hybrid RAG Fusion & Contradictions:** Complete 4-step fusion algorithm.
- [x] **4D Risk & Pricing Ceiling Check:** Complete.
- [x] **FastAPI REST Endpoints & Queue:** Complete.
