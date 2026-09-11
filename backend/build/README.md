# AutonoSource Build & Database Ingestion Engine (`backend/build/`)

This directory houses the idempotent build and ingestion pipelines responsible for initializing, populating, and synchronizing all storage layers of AutonoSource under `backend/processed_data/`:

```
backend/build/
├── build_all.py                   # Master idempotent clean-and-rebuild script for all databases
├── seed_relational.py             # Seeds SQLite relational tables, case ledger, and initial test cases
├── ingest_rag_docs.py             # Chunks verified regulatory PDFs/contracts & embeds into Qdrant vector store
├── build_knowledge_graph.py       # Constructs the multi-entity NetworkX property graph (GraphML + JSON)
├── embedding_pipeline.py          # Nomic-ai/nomic-embed-text-v1.5 768-dim dense embedding generator
└── README.md
```

## Running the Build

### 1. Master Clean & Rebuild (Recommended)
To clean all existing database artifacts and deterministically rebuild all storage layers in one command:

```bash
# From repository root:
python backend/build/build_all.py

# Or from the backend directory:
cd backend
python build/build_all.py
```

This single command:
1. Flushes and re-creates `backend/processed_data/` as a clean, flat output hub.
2. Populates `processed_data/` with SQLite `procurement_cases.db` and JSON case ledger.
3. Ingests regulatory PDFs (via `pymupdf4llm`) and SLA contracts, computing Nomic 768-dim embeddings in `vector_embeddings.json`.
4. Traverses entity relationships and generates `knowledge_graph.graphml` and `knowledge_graph.json`.
5. Syncs the statutory NPPA DPCO 2013 ceiling price dataset into `pricing_ceiling_catalog.json`.
6. Copies verified sample contracts to the root of `processed_data/`.

### 2. Running Individual Ingestion Pipelines
You can also run modular pipeline components individually:

```bash
# Relational Database seeding only:
python backend/build/seed_relational.py

# RAG vector store ingestion only:
python backend/build/ingest_rag_docs.py

# Knowledge graph generation only:
python backend/build/build_knowledge_graph.py
```
