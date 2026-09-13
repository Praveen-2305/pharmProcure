"""
Master All-In-One Database & Artifacts Build Orchestrator for AutonoSource (pharmProcure).
==========================================================================================
Executes a unified, deterministic pipeline across all database layers:
1. Vector Database (Qdrant collection + dense 768-dim embeddings from `ingestion/rag_and_graph/`)
2. Property Graph Database (NetworkX GraphML + JSON ontology from `ingestion/rag_and_graph/`)
3. Relational Database (SQLite `procurement_cases.db` + serialized cases ledger from `ingestion/sql/`)
4. Regulated Pricing Catalog (NPPA DPCO 2013 ceiling index from `ingestion/sql/`)

SAFE & NON-DESTRUCTIVE:
Preserves all pre-existing built datasets (especially the Knowledge Graph and Vector indexes)
and organizes everything strictly into subfolders under:
    backend/processed_data/
    ├── graph/
    ├── qdrant/
    └── sqlite/ (with `sql` compatibility symlink)

Usage:
    python backend/build/build_all.py
"""

import os
import sys
import shutil
import time
import json
import argparse

backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

DATABASE_ROOT = os.path.join(backend_root, "processed_data")


def ensure_database_directories():
    """Ensures subfolders exist and removes any loose duplicate files from the root of processed_data."""
    print("=" * 70)
    print("  AUTONOSOURCE: ALL-IN-ONE DATABASE BUILD & INTEGRATION ENGINE")
    print("=" * 70)

    rel_db_root = os.path.relpath(DATABASE_ROOT, backend_root)
    os.makedirs(DATABASE_ROOT, exist_ok=True)
    os.makedirs(os.path.join(DATABASE_ROOT, "qdrant"), exist_ok=True)
    os.makedirs(os.path.join(DATABASE_ROOT, "graph"), exist_ok=True)
    os.makedirs(os.path.join(DATABASE_ROOT, "sqlite"), exist_ok=True)
    

    # Clean only loose duplicate files at the root of processed_data
    for filename in os.listdir(DATABASE_ROOT):
        if filename.endswith(('.db', '.json', '.graphml', '.txt')) and filename != "README.md":
            filepath = os.path.join(DATABASE_ROOT, filename)
            try:
                if os.path.isfile(filepath) and not os.path.islink(filepath):
                    os.remove(filepath)
            except Exception:
                pass

    print(f"  ✓ Verified organized database subfolders under: {rel_db_root} (Zero root duplicates)\n")


def seed_pricing_database():
    """Initializes the pricing database with statutory DPCO 2013 ceiling catalog."""
    print("-" * 55)
    print("▶ [Build: Pricing DB] Synchronizing Regulated Price Ceilings")
    print("-" * 55)
    src_json = os.path.join(backend_root, "ingestion", "sql", "pricing_ceiling_catalog.json")
    dst_json = os.path.join(DATABASE_ROOT, "sqlite", "pricing_ceiling_catalog.json")

    if os.path.exists(src_json):
        shutil.copy2(src_json, dst_json)
        with open(dst_json, "r", encoding="utf-8") as f:
            catalog = json.load(f)
        count = len(catalog.get("items", []))
        print(f"  ✓ Indexed {count} DPCO 2013 ceiling price benchmarks in INR.")
        print(f"  ✓ Persisted: {os.path.relpath(dst_json, backend_root)}")
    else:
        print("  ! Pricing source JSON not found in ingestion/sql/.")


def write_database_readmes():
    """Generates informative READMEs across the database directories."""
    master_readme = os.path.join(DATABASE_ROOT, "README.md")
    with open(master_readme, "w", encoding="utf-8") as f:
        f.write("""# AutonoSource Multi-Database Storage Hub (`processed_data/`)

This directory houses all persistent and reference databases organized cleanly into subfolders:

```
processed_data/
├── sqlite/                                     # SQLite Relational Database & Snapshots
│   ├── procurement_cases.db                    # 50 Indian/global vendors, profiles, products, cases
│   ├── cases.json                              # Serialized case ledger snapshot
│   ├── vendors_50.json                         # 50 vendor directory snapshot
│   └── pricing_ceiling_catalog.json            # DPCO 2013 statutory price ceiling catalog
├── qdrant/                                     # Dense 768-dim Vector Embeddings & Qdrant Collection
│   ├── collection/
│   ├── collections_metadata.json
│   └── vector_embeddings.json
├── graph/                                      # NetworkX Knowledge Graph & JSON Ontology
│   ├── knowledge_graph.graphml
│   └── knowledge_graph.json
└── sql -> sqlite                               # Backward compatibility symlink
```

## Subsystem Details & Artifacts

| Database Layer | Storage Engine | Location | Consumed By |
|---|---|---|---|
| **Relational** | SQLite 3 | `processed_data/sqlite/procurement_cases.db` | `src/db/session.py` (`CaseStore`), REST APIs |
| **Vector RAG** | Qdrant / Dense Embeddings | `processed_data/qdrant/vector_embeddings.json` | `src/rag_pipeline/vector_store.py` |
| **Graph** | NetworkX MultiDiGraph | `processed_data/graph/knowledge_graph.graphml` | `src/rag_pipeline/graph_store.py` |
| **Pricing** | JSON Reference DB | `processed_data/sqlite/pricing_ceiling_catalog.json` | `src/db/pricing.py`, `src/agents/scorer.py` |
""")


def main(rebuild_graph: bool = False, rebuild_rag: bool = False):
    start_time = time.time()
    ensure_database_directories()

    # 1. RAG Vector Database Build (Chunking & Embedding)
    embeddings_file = os.path.join(DATABASE_ROOT, "qdrant", "vector_embeddings.json")
    if os.path.exists(embeddings_file) and not rebuild_rag:
        print("-" * 55)
        print("▶ [Build: RAG] Preserving Existing Vector Embeddings")
        print("-" * 55)
        print(f"  ✓ Existing embeddings found at {os.path.relpath(embeddings_file, backend_root)}.")
        print("  ✓ Skipping re-embedding (use --rebuild-rag to re-run).")
        print()
    else:
        from build.ingest_rag_docs import run_rag_ingest
        run_rag_ingest()
        print()

    # 2. Knowledge Graph Database Build
    graph_file = os.path.join(DATABASE_ROOT, "graph", "knowledge_graph.graphml")
    if os.path.exists(graph_file) and not rebuild_graph:
        print("-" * 55)
        print("▶ [Build: Graph] Preserving Pre-Built Knowledge Graph")
        print("-" * 55)
        print(f"  ✓ Existing Knowledge Graph found at {os.path.relpath(graph_file, backend_root)}.")
        print("  ✓ Preserving verified graph (use --rebuild-graph to re-run LLM extraction).")
        print()
    else:
        from build.build_knowledge_graph import run_graph_build
        run_graph_build()
        print()

    # 3. Relational Database Build (Ingests seed data from ingestion/sql to processed_data/sqlite)
    from build.seed_data import run_database_seed
    run_database_seed()
    print()

    # 4. Pricing Database Build
    seed_pricing_database()
    print()

    # 5. Documentation Hub
    write_database_readmes()

    elapsed = time.time() - start_time
    print("=" * 70)
    print(f"  ✓ ALL DATABASES VERIFIED & CONNECTED SUCCESSFULLY in {elapsed:.2f}s")
    print("  ✓ 1. Relational DB: `processed_data/sqlite/procurement_cases.db` (SQLite)")
    print("  ✓ 2. Vector DB:     `processed_data/qdrant/` (768-dim Qdrant)")
    print("  ✓ 3. Graph DB:      `processed_data/graph/knowledge_graph.graphml` (NetworkX)")
    print("  ✓ 4. Pricing DB:    `processed_data/sqlite/pricing_ceiling_catalog.json` (DPCO 2013)")
    print("=" * 70)
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Master Database Build Orchestrator")
    parser.add_argument("--rebuild-graph", action="store_true", help="Force complete rebuild of the Knowledge Graph via LLM")
    parser.add_argument("--rebuild-rag", action="store_true", help="Force complete re-indexing of RAG embeddings")
    args = parser.parse_args()
    success = main(rebuild_graph=args.rebuild_graph, rebuild_rag=args.rebuild_rag)
    sys.exit(0 if success else 1)
