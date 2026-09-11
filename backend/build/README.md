# AutonoSource Build & Database Ingestion Engine (`backend/build/`)

This directory houses the idempotent build and ingestion pipelines responsible for initializing, populating, and synchronizing all 5 storage layers of AutonoSource under `backend/database/`:

```
backend/build/
├── build_all.py                   # Master idempotent clean-and-rebuild script for all 5 databases
├── run_build.py                   # Convenience orchestrator wrapper
├── database/
│   ├── __init__.py
│   └── seed_database.py          # Seeds SQLite relational tables, case ledger, and initial test cases
├── rag/
│   ├── __init__.py
│   └── ingest_documents.py        # Chunks verified regulatory PDFs/contracts & embeds into Qdrant vector store
├── graph/
│   ├── __init__.py
│   └── build_knowledge_graph.py   # Constructs the multi-entity NetworkX property graph (GraphML + JSON)
└── README.md
```

## Running the Build

### 1. Master Clean & Rebuild (Recommended)
To clean all existing database artifacts and deterministically rebuild all 5 storage layers in one command:

```bash
# From repository root:
python backend/build/build_all.py

# Or from the backend directory:
cd backend
python build/build_all.py
```

This single command:
1. Flushes and re-creates `backend/database/` with its 5 specialized subdirectories (`relational/`, `vector/`, `graph/`, `pricing/`, `contracts/`).
2. Populates `relational/` with SQLite `procurement_cases.db` and JSON case ledger.
3. Ingests regulatory PDFs and SLA contracts, computing dense embeddings in `vector/`.
4. Traverses entity relationships and generates `knowledge_graph.graphml` and `knowledge_graph.json` in `graph/`.
5. Syncs the statutory NPPA DPCO 2013 ceiling price dataset into `pricing/`.
6. Copies verified sample contracts into `contracts/`.

### 2. Running Individual Ingestion Pipelines
You can also run modular pipeline components individually:

```bash
# Relational Database seeding only:
python backend/build/database/seed_database.py

# RAG vector store ingestion only:
python backend/build/rag/ingest_documents.py

# Knowledge graph generation only:
python backend/build/graph/build_knowledge_graph.py
```
