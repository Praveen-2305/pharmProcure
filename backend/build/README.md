# AutonoSource Build & Database Ingestion Engine (`backend/build/`)

This directory houses the database ingestion, vector chunking, and knowledge graph construction pipelines responsible for initializing and synchronizing storage layers under `backend/processed_data/`:

```
backend/build/
├── build_all.py                   # Master builder with automatic dataset preservation
├── seed_data.py                   # Ingests 50 vendors, products, and DPCO catalog into SQLite
├── ingest_rag_docs.py             # Chunks verified regulatory documents & embeds into local Qdrant
├── build_knowledge_graph.py       # Constructs the multi-entity NetworkX property graph (GraphML + JSON)
├── embedding_pipeline.py          # Nomic-ai/nomic-embed-text-v1.5 768-dim dense embedding generator
├── graph/                         # High-throughput knowledge graph tooling
│   ├── build_kg_groq.py           # Multi-key parallel Groq pipeline for extracting regulatory relations
│   └── audit_groq_keys.py         # Validates and audits available Groq API keys and rate limits
└── sql/                           # Relational seeding generators
    └── seed_vendors.py            # Generates realistic 50 Indian pharmaceutical vendors dataset
```

---

## 🗄️ Output Storage Hub (`backend/processed_data/`)

All generated datasets are stored strictly inside organized subdirectories under `backend/processed_data/`:

1. **`sqlite/`**:
   - `procurement_cases.db`: Full relational SQLite database containing 6 core tables (`vendors`, `vendor_products`, `pricing_references`, `procurement_cases`, `audit_logs`, `vendor_profiles`).
   - `procurement_cases.json`: Synchronized JSON export of baseline procurement cases.
2. **`graph/`**:
   - `knowledge_graph.graphml`: 5,757-node multi-entity regulatory property graph covering CDSCO, DPCO 2013, Schedule M, and WHO TRS 1025.
   - `knowledge_graph.json`: Serialized JSON graph export for debugging and frontend inspection.
3. **`qdrant/`**:
   - Local on-disk Qdrant storage directory hosting dense 768-dimensional vector collections (`procurement_regulatory_docs`).

---

## 🛡️ Dataset Safety & Preservation Rules

> [!IMPORTANT]
> The master builder (`build_all.py`) is engineered to **preserve existing processed datasets** by default:
> - If `processed_data/graph/knowledge_graph.graphml` (5,757 nodes) already exists, it will **NOT** be overwritten unless `--rebuild-graph` or `--force-clean` is explicitly specified.
> - If `processed_data/qdrant/` already exists, vector embeddings will **NOT** be re-computed unless `--rebuild-vector` or `--force-clean` is explicitly specified.
> - `seed_data.py` safely creates missing tables and upserts records without destroying case history.

---

## 🚀 Running Build & Ingestion Scripts

### 1. Seeding Relational Data Only (Recommended)
To initialize or refresh the 50 vendors directory, product catalog, and DPCO 2013 price ceiling references in SQLite:

```bash
# From repository root:
python backend/build/seed_data.py

# Or from backend directory:
cd backend
python build/seed_data.py
```

### 2. Running Individual Ingestion Pipelines

```bash
# Ingest regulatory PDFs and contracts into Qdrant vector store:
python backend/build/ingest_rag_docs.py

# Rebuild the NetworkX knowledge graph:
python backend/build/build_knowledge_graph.py

# Run the high-throughput multi-key Groq knowledge graph pipeline:
python backend/build/graph/build_kg_groq.py

# Audit and validate your Groq API keys:
python backend/build/graph/audit_groq_keys.py
```

### 3. Full Rebuild (Caution)
To perform an end-to-end clean and rebuild:

```bash
# Standard run (skips already generated heavy datasets):
python backend/build/build_all.py

# Force clean and full rebuild of everything (takes several minutes):
python backend/build/build_all.py --force-clean
```
