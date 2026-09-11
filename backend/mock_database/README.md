# AutonoSource Mock Database Ecosystem

This directory contains the complete reference mock database ecosystem for **AutonoSource (pharmProcure)**. It provides structured test data, realistic pharmaceutical vendor case files, statutory pricing benchmarks, knowledge graphs, and contract clauses to power the backend pipeline without requiring external production database servers.

---

## 🗄️ Database Ecosystem Overview

AutonoSource utilizes 5 specialized mock database layers, designed to mirror production behavior and feed directly into the build system:

```
                                MOCK DATABASE ARCHITECTURE
                                
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                                    MOCK DATA LAYERS                                    │
  └───────┬────────────────────┬─────────────────────┬───────────────────┬─────────────────┘
          │                    │                     │                   │
          ▼                    ▼                     ▼                   ▼
   ┌─────────────┐      ┌─────────────┐       ┌─────────────┐     ┌─────────────┐
   │ 1. Vector   │      │ 2. Graph    │       │ 3. Pricing  │     │ 4. Contracts│
   │ [vector/]   │      │ [graph/]    │       │ [pricing/]  │     │ [contracts/]│
   │ Qdrant      │      │ NetworkX    │       │ NPPA DPCO   │     │ Vendor MSAs │
   │ chunks &    │      │ MultiDiGraph│       │ statutory   │     │ and cold    │
   │ payloads    │      │ entities    │       │ ceilings    │     │ chain SLAs  │
   └──────┬──────┘      └──────┬──────┘       └──────┬──────┘     └──────┬──────┘
          │                    │                     │                   │
          └───────────┬────────┘                     │                   │
                      │                              │                   │
                      ▼                              ▼                   ▼
           ┌─────────────────────┐        ┌──────────────────────────────────────┐
           │    Fusion Engine    │        │       5. Case Ledger [cases/]        │
           │ Contradiction check │        │ SQLite `procurement_cases.db` & JSON │
           └──────────┬──────────┘        └──────────────────┬───────────────────┘
                      │                                      │
                      ▼                                      ▼
           ┌─────────────────────────────────────────────────────────────────────┐
           │                        Frontend API Contract                        │
           │         /procurement/submit • /status • /report • /all              │
           │                     /approval/pending • /decide                     │
           └─────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Subdirectory Structure

| Subdirectory | Target Database | Contents | Purpose |
|---|---|---|---|
| **[`cases/`](./cases/)** | SQLite / `CaseStore` | Pre-seeded cases (`cases.json`) + Casefile README | Powers `GET /procurement/all` and `GET /approval/pending`. |
| **[`pricing/`](./pricing/)** | NPPA / DPCO Table | Statutory ceilings (`pricing_ceiling_catalog.json`) | Deterministic mathematical ceiling audit in Scorer. |
| **[`graph/`](./graph/)** | NetworkX Graph | Entities & Triples (`entities_and_relations.json`) | Multi-hop regulatory traversal and path scoring. |
| **[`contracts/`](./contracts/)** | Text / Markdown Docs | Realistic Vendor MSAs & SLAs | Provides real clauses for vector similarity search. |
| **[`vector/`](./vector/)** | Qdrant Vector Store | Chunk points & payloads (`sample_vector_payloads.json`) | Semantic search over contract terms and regulations. |

---

## 🚀 How the Backend Pipeline Uses This Mock Data

1. **On Startup & Initialization:**
   - Run `python backend/build/build_all.py` to ingest mock data and regulatory PDFs into `backend/database/`.
   - [`app/db/session.py`](../app/db/session.py) initializes the SQLite database at `backend/database/relational/procurement_cases.db` using `cases/cases.json` as seed data.
   - [`app/db/pricing.py`](../app/db/pricing.py) loads `pricing/pricing_ceiling_catalog.json` (or `backend/rag_storage/pricing/`) for deterministic ceiling lookups.
   - [`app/rag/graph_store.py`](../app/rag/graph_store.py) initializes the NetworkX graph from `backend/database/graph/knowledge_graph.graphml` (or built from `graph/entities_and_relations.json`).
   - [`app/rag/vector_store.py`](../app/rag/vector_store.py) indexes chunks from `contracts/` and regulatory PDFs into Qdrant.

2. **On Deal Submission (`POST /procurement/submit`):**
   - Launches the autonomous LangGraph agent pipeline.
   - Queries `vector/` and `graph/` in parallel.
   - Cross-checks vendor quotes against statutory ceilings in `pricing/`.
   - Performs live adverse due diligence with the web scraper (`app/rag/web_scraper.py`).
   - Updates `cases/` with live status and writes the final `ProcurementReport`.
