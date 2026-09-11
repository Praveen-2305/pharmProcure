# AutonoSource Multi-Database Storage Hub (`backend/database/`)

This directory houses all persistent and reference databases utilized by the AutonoSource multi-agent audit pipeline:

```
backend/database/
├── relational/             # SQLite database `procurement_cases.db` & serialized case ledger (`cases.json`)
├── vector/                 # Dense 384-dimensional vector embeddings & Qdrant collection snapshots
├── graph/                  # NetworkX Property Graph (`knowledge_graph.graphml` & `knowledge_graph.json`)
├── pricing/                # Statutory NPPA DPCO 2013 ceiling price catalog (`pricing_ceiling_catalog.json`)
└── contracts/              # Verified SLA contracts and pharma Master Services Agreements
```

## Subsystem Details & Artifacts

| Subdirectory | Storage Engine | Files | Consumed By |
|---|---|---|---|
| **`relational/`** | SQLite 3 | `procurement_cases.db`, `cases.json` | `app/db/session.py` (`CaseStore`), REST APIs (`/procurement/*`, `/approval/*`) |
| **`vector/`** | Qdrant / Dense Embeddings | `vector_embeddings.json`, `collections_metadata.json` | `app/rag/vector_store.py`, `app/rag/embedding_pipeline.py` |
| **`graph/`** | NetworkX MultiDiGraph | `knowledge_graph.graphml`, `knowledge_graph.json` | `app/rag/graph_store.py` (Multi-hop path traversals & entity scoring) |
| **`pricing/`** | JSON Reference DB | `pricing_ceiling_catalog.json` | `app/db/pricing.py`, `app/agents/scorer.py` (Statutory ceiling verification) |
| **`contracts/`** | Markdown / Text MSAs | `Apex_BioLogistics_SLA.md`, `NovaVaccines_ColdChain_Agreement.md`, etc. | Vector ingestion & contract risk clause auditing |

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
