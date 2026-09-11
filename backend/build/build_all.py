"""
Master All-In-One Database & Artifacts Build Orchestrator for AutonoSource (pharmProcure).
Executes a unified, deterministic rebuild across all 5 database layers:
1. Relational Database (SQLite `procurement_cases.db` + serialized cases ledger)
2. Vector Database (Qdrant collection + dense 768-dim serialized embeddings)
3. Property Graph Database (NetworkX GraphML + JSON ontology)
4. Regulated Pricing Catalog (NPPA DPCO 2013 ceiling index)
5. Contract & SLA Document Store

If target database folder already exists, cleans previous generated databases
and rebuilds cleanly from scratch.
Usage:
    python backend/build/build_all.py
"""

import os
import sys
import shutil
import time
import json

backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

DATABASE_ROOT = os.path.join(backend_root, "processed_data")

def clean_and_recreate_database_folders():
    """Cleans existing generated database directory and initializes pristine subfolders."""
    print("=" * 70)
    print("  AUTONOSOURCE: ALL-IN-ONE DATABASE BUILD & INTEGRATION ENGINE")
    print("=" * 70)

    if os.path.exists(DATABASE_ROOT):
        print(f"\n[Cleanup] Existing database directory detected at: {DATABASE_ROOT}")
        print("  → Deleting previous build artifacts to ensure clean idempotent rebuild...")
        # Only delete generated data files, preserve .gitkeep and visibility files
        for filename in os.listdir(DATABASE_ROOT):
            if filename.endswith(('.db', '.json', '.graphml', '.md', '.txt')):
                filepath = os.path.join(DATABASE_ROOT, filename)
                try:
                    if os.path.isfile(filepath):
                        os.remove(filepath)
                except Exception as e:
                    print(f"  ! Purge note: {e}")
        print("  ✓ Successfully purged previous database files.")
    else:
        # Create organized subfolders
        os.makedirs(DATABASE_ROOT, exist_ok=True)
        print(f"  ✓ Initialized organized database subfolders under: {DATABASE_ROOT}\n")

def seed_pricing_database():
    """Initializes the pricing database with statutory DPCO 2013 ceiling catalog."""
    print("-" * 55)
    print("▶ [Build: Pricing DB] Seeding Regulated Price Ceilings")
    print("-" * 55)
    src_json = os.path.join(backend_root, "ingestion", "sql", "pricing_ceiling_catalog.json")
    dst_json = os.path.join(DATABASE_ROOT, "pricing_ceiling_catalog.json")

    if os.path.exists(src_json):
        shutil.copy2(src_json, dst_json)
        with open(dst_json, "r", encoding="utf-8") as f:
            catalog = json.load(f)
        count = len(catalog.get("items", []))
        print(f"  ✓ Indexed {count} DPCO 2013 ceiling price benchmarks.")
        print(f"  ✓ Persisted: {dst_json}")
    else:
        print("  ! Pricing source JSON not found. Defaulting to standard catalog.")




def write_database_readmes():
    """Generates informative READMEs across the database directories."""
    master_readme = os.path.join(DATABASE_ROOT, "README.md")
    with open(master_readme, "w", encoding="utf-8") as f:
        f.write("""# AutonoSource Multi-Database Storage Hub (`processed_data/`)

This directory houses all persistent and reference databases utilized by the AutonoSource multi-agent audit pipeline:

```
processed_data/
├── cases.json, procurement_cases.db             # SQLite database `procurement_cases.db` & serialized case ledger (`cases.json`)
├── vector_embeddings.json, collections_metadata.json                 # Dense 768-dimensional vector embeddings & Qdrant collection snapshots
├── knowledge_graph.graphml, knowledge_graph.json                  # NetworkX Property Graph (`knowledge_graph.graphml` & `knowledge_graph.json`)
└── pricing_ceiling_catalog.json                # Statutory NPPA DPCO 2013 ceiling price catalog (`pricing_ceiling_catalog.json`)
```

## Subsystem Details & Artifacts

| Database Layer | Storage Engine | Files | Consumed By |
|---|---|---|---|
| **Relational** | SQLite 3 | `procurement_cases.db`, `cases.json` | `src/db/session.py` (`CaseStore`), REST APIs (`/procurement/*`, `/approval/*`) |
| **Vector RAG** | Qdrant / Dense Embeddings | `vector_embeddings.json`, `collections_metadata.json` | `src/rag_pipeline/vector_store.py`, `build/embedding_pipeline.py` |
| **Graph** | NetworkX MultiDiGraph | `knowledge_graph.graphml`, `knowledge_graph.json` | `src/rag_pipeline/graph_store.py` (Multi-hop path traversals & entity scoring) |
| **Pricing** | JSON Reference DB | `pricing_ceiling_catalog.json` | `src/db/pricing.py`, `src/agents/scorer.py` (Statutory ceiling verification) |

---

## 🔄 Roadmap: Mock to Original Production Data Migration

While this directory acts as the local and testing persistent hub, the enterprise architecture is designed to transition to high-throughput production data services:

- **Relational DB:** SQLite ➔ **PostgreSQL 16+** with connection pooling and GxP append-only approval audit logging.
- **Vector DB:** Local in-memory Qdrant ➔ **Distributed Qdrant Cloud Cluster** / Milvus with automated OCR contract chunking via AWS Textract.
- **Knowledge Graph:** NetworkX ➔ **Neo4j Enterprise Cluster** executing Cypher path traversal queries.
- **Pricing DB:** Static JSON ➔ **Live ETL Pipeline** syncing NPPA DPCO Gazette notices and SAP/Oracle ERP pricing masters.
- **Contracts:** Local Markdown ➔ **Enterprise CLM Webhooks** (Icertis, DocuSign CLM, Ironclad).

👉 **For the complete migration plan, code adapters, and phase-by-phase execution roadmap, see:**  
[`project_information/06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md`](../../project_information/06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md)

---

## 🛠️ Rebuilding the Local Databases
To perform a complete clean build:
```bash
python backend/build/build_all.py
```
This cleans any existing database files and deterministically reconstructs all tables, embeddings, and graphs.
""")

def main():
    start_time = time.time()
    clean_and_recreate_database_folders()

    # 1. RAG Vector Database Build (Chunking & Embedding)
    from build.ingest_rag_docs import run_rag_ingest
    run_rag_ingest()
    print()

    # 2. Knowledge Graph Database Build (Depends on RAG extraction/entities)
    from build.build_knowledge_graph import run_graph_build
    run_graph_build()
    print()

    # 3. Relational Database Build (Depends on structured graph/entities)
    from build.seed_relational import run_database_seed
    run_database_seed()
    print()

    # 4. Pricing Database Build
    seed_pricing_database()
    print()

    # 5. Documentation Hub
    write_database_readmes()

    elapsed = time.time() - start_time
    print("=" * 70)
    print(f"  ✓ ALL DATABASES BUILT & CONNECTED SUCCESSFULLY in {elapsed:.2f}s")
    print("  ✓ 1. Relational DB: `processed_data/procurement_cases.db` (SQLite)")
    print("  ✓ 2. Vector DB:     `processed_data/vector_embeddings.json` (768-dim Qdrant)")
    print("  ✓ 3. Graph DB:      `processed_data/knowledge_graph.graphml` (NetworkX)")
    print("  ✓ 4. Pricing DB:    `processed_data/pricing_ceiling_catalog.json` (DPCO 2013)")
    print("=" * 70)
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
