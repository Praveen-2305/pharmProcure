# AutonoSource Multi-Database Storage Hub (`processed_data/`)

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
