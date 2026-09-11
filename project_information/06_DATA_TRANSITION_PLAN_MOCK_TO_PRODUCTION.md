# AutonoSource — Data Transition Plan: From Mock to Production (Original Data)

## 📌 Executive Summary

During Proof-of-Concept (POC v2.0) development, **AutonoSource (pharmProcure)** implemented a comprehensive 5-layer mock database ecosystem. This mock setup enabled rapid iteration, deterministic automated testing, and zero-dependency local development while testing complex agent workflows (such as cold chain contradiction detection and statutory price ceiling validation).

This document outlines the **architectural, operational, and code migration plan** to transition AutonoSource from local mock data fixtures to live enterprise production data systems without regressions in API contracts, agent reasoning, or frontend responsiveness.

---

## 🧭 Comparative Architecture: Mock vs. Original Production Data

The platform spans 6 critical data layers. The table below contrasts the current local implementation with the target enterprise production infrastructure:

| Data Layer | Current Mock Implementation | Target Original Production Architecture | Primary Challenges & Migration Strategy |
| :--- | :--- | :--- | :--- |
| **1. Relational Case Ledger & Approvals** | SQLite 3 (`procurement_cases.db`) + in-memory `CaseStore` cache (`app/db/session.py`) | **PostgreSQL 16+** on AWS RDS / Azure Database for PostgreSQL with PgBouncer connection pooling, SQLAlchemy ORM, and Alembic migrations. | • **Concurrency:** Implement row-level locking (`SELECT ... FOR UPDATE`) for human approval actions.<br>• **Auditability:** Enable immutable audit ledger tables capturing who approved what, timestamp, and role. |
| **2. Vector Store & RAG Ingestion** | Local in-memory Qdrant client (`:memory:`) or serialized JSON embeddings (`vector_embeddings.json`) using 384-dim `all-MiniLM-L6-v2`. | **Distributed Qdrant Cloud Cluster** (or Milvus/pgvector) with HNSW indexing, utilizing domain-specific embeddings (e.g., `text-embedding-3-large` 1536-dim or `PubMedBERT`). | • **Scale:** Ingesting thousands of multi-page agreements.<br>• **Ingestion Pipeline:** Deploy automated OCR/chunking pipeline using Unstructured.io or AWS Textract triggered by S3 uploads. |
| **3. Regulatory & Legal Knowledge Graph** | NetworkX in-memory `MultiDiGraph` serialized to GraphML (`knowledge_graph.graphml`) and JSON. | **Neo4j Enterprise Cluster** (or Amazon Neptune) with Cypher query language, APOC procedures, and Neo4j Bloom graph exploration. | • **Entity Resolution:** Automated entity linking from unstructured regulatory notices to existing vendor and drug nodes.<br>• **GraphRAG:** Replace NetworkX BFS with optimized Cypher path queries. |
| **4. Statutory Pricing Benchmark DB** | Static JSON file (`pricing_ceiling_catalog.json`) modeling 16 DPCO regulated formulations. | **PostgreSQL / TimescaleDB Master Pricing DB** populated by automated daily ETL scraping of official **NPPA DPCO Gazettes** and WPI revisions, integrated with SAP/Oracle ERP pricing masters. | • **Dynamic Ceilings:** Automatically adjust ceilings based on annual Wholesale Price Index (WPI) revisions.<br>• **SKU Mapping:** Multi-lingual and brand-to-generic formulation mapping. |
| **5. Contracts, SLAs & Master Agreements** | Markdown and plain text sample files (`Apex_BioLogistics_SLA.md`, `NovaVaccines_ColdChain_Agreement.md`). | Direct API webhooks to **Enterprise CLM Platforms** (Icertis, DocuSign CLM, Ironclad, SAP Ariba Contracts) and secure cloud DMS (SharePoint, Box). | • **Legacy Scans:** OCR processing of signed PDF scans.<br>• **Redlining & Versions:** Tracking amendment addenda and clause variations across revisions. |
| **6. Vendor Due Diligence & Web Intelligence** | Deterministic fallback heuristics + live search scraper (`web_scraper.py`) querying Tavily/Google/DDG. | **Live Enterprise API Connectors**:<br>• Ministry of Corporate Affairs (MCA21 API)<br>• US FDA Warning Letters & 483s (openFDA API)<br>• CDSCO Gazette notifications<br>• National e-Courts litigation feeds<br>• Dun & Bradstreet / Experian Credit APIs | • **Rate Limits & Auth:** Enterprise credential rotation and caching.<br>• **Signal Filtering:** Automated deduplication and sentiment categorization of adverse news. |

---

## 🗺️ 4-Phase Transition Roadmap

```
  PHASE 1: Abstraction & Dual-Run      PHASE 2: Ingestion & Staging       PHASE 3: Live Enterprise Connectors    PHASE 4: Production Cutover
             (Weeks 1-3)                         (Weeks 4-6)                         (Weeks 7-9)                        (Weeks 10-12)
  ┌───────────────────────────────┐   ┌───────────────────────────────┐   ┌───────────────────────────────┐   ┌───────────────────────────────┐
  │ • Interface extraction        │   │ • Deploy PostgreSQL & Qdrant  │   │ • Connect SAP Ariba & CLM     │   │ • Flip DATA_MODE to "prod"    │
  │ • Repository design pattern   │──►│ • Live NPPA / CDSCO crawler   │──►│ • Connect MCA21 & openFDA     │──►│ • Blue/Green deployment       │
  │ • Config-driven switching     │   │ • Batch contract ingestion    │   │ • Webhook-driven case entry   │   │ • Observability & tracing     │
  │ • Shadow writing to PostgreSQL│   │ • Parallel validation runs    │   │ • End-to-end integration test │   │ • Retain mock for CI tests    │
  └───────────────────────────────┘   └───────────────────────────────┘   └───────────────────────────────┘   └───────────────────────────────┘
```

### Phase 1: Abstraction & Dual-Run (Weeks 1 – 3)
1. **Repository Pattern Implementation:**
   - Abstract data operations behind abstract base classes: `ICaseRepository`, `IVectorStore`, `IGraphStore`, `IPricingService`, `IContractService`.
   - The current mock classes become default implementations for `DATA_MODE=mock`.
2. **Environment Variable Configuration:**
   - Introduce granular configuration flags in `backend/app/config.py`:
     ```bash
     DATA_MODE=production           # or 'mock'
     DATABASE_URL=postgresql://user:pass@db-host:5432/autonosource
     QDRANT_URL=https://qdrant-cluster.internal:6333
     QDRANT_API_KEY=secret_key
     NEO4J_URI=bolt://neo4j-cluster.internal:7687
     NEO4J_AUTH=neo4j/password
     CLM_PROVIDER=icertis           # or 'docusign', 'mock'
     ```
3. **Database Migration Baseline:**
   - Set up Alembic schema migrations targeting PostgreSQL, reproducing the schema defined in `backend/build/database/seed_database.py`.

### Phase 2: Ingestion Pipelines & Staging Deployment (Weeks 4 – 6)
1. **Automated Regulatory Crawler:**
   - Deploy scheduled crawlers (via Celery / Temporal / AWS Lambda) that monitor:
     - `nppa.gov.in` for newly notified ceiling prices.
     - `cdsco.gov.in` for public safety alerts and non-standard quality (NSQ) drug batches.
2. **High-Throughput Contract Ingestion:**
   - Migrate `backend/build/rag/ingest_documents.py` to use `UnstructuredPDFLoader` and batch embeddings with `text-embedding-3-large`.
   - Ingest genuine enterprise pharma agreements into the staging Qdrant collection (`enterprise_procurement_contracts`).
3. **Knowledge Graph Migration to Neo4j:**
   - Export NetworkX triples via Cypher `LOAD CSV` or APOC procedures into a dedicated Neo4j instance.
   - Refactor `GraphRAGRetriever` to execute Cypher queries:
     ```cypher
     MATCH (v:Vendor {name: $vendor_name})-[r:COMPLIES_WITH|CITED_IN|GOVERNED_BY*1..2]-(n)
     RETURN v, r, n, length(shortestPath((v)--(n))) AS path_length
     ```

### Phase 3: Live Enterprise Connectors & CLM Integration (Weeks 7 – 9)
1. **Contract Lifecycle Management (CLM) Ingestion:**
   - Implement webhook listener `/api/v1/integrations/clm/webhook` receiving executed agreements from Icertis or DocuSign CLM.
   - On contract upload, trigger chunking, embedding, and knowledge graph relation extraction.
2. **Enterprise Due Diligence API Integration:**
   - Upgrade `web_scraper.py` to query official APIs directly:
     - **Ministry of Corporate Affairs (MCA21):** Validates CIN, Director status, paid-up capital, charges/defaults.
     - **openFDA API:** Fetches 483 inspection citations, warning letters, and import alerts by vendor name.
     - **e-Courts National Judicial Data Grid (NJDG):** Searches for pending litigation against vendor entities.

### Phase 4: Full Production Cutover & Observability (Weeks 10 – 12)
1. **Validation & Shadow Testing:**
   - Run parallel evaluations: Compare audit scores generated under mock data vs. live enterprise data for historical cases.
   - Ensure risk scoring variance is < 5% unless explained by newly uncovered live regulatory violations.
2. **Observability & Tracing:**
   - Instrument LangGraph nodes with OpenTelemetry, Langfuse, or Arize Phoenix to trace token spend, latency, and retrieval quality.
3. **CI/CD Integration:**
   - Retain the entire `backend/mockdata/` and `backend/build/build_all.py` setup in the repository as the primary automated integration test fixture for GitHub Actions / CI pipelines.

---

## 💻 Codebase Adaptation Guide

### 1. Database Configuration (`backend/app/config.py`)
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Operating Mode
    DATA_MODE: str = "mock"  # Options: 'mock', 'production'

    # Relational Storage
    DATABASE_URL: str = "sqlite:///backend/database/relational/procurement_cases.db"

    # Vector Database
    QDRANT_HOST: str = ":memory:"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION: str = "procurement_contracts"

    # Knowledge Graph
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = ""

    # Live Intelligence APIs
    TAVILY_API_KEY: str = ""
    OPENFDA_API_KEY: str = ""
    MCA21_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
```

### 2. Relational Repository Adapter (`backend/app/db/session.py`)
```python
if settings.DATA_MODE == "production":
    # Connect to PostgreSQL via SQLAlchemy / asyncpg engine
    from sqlalchemy.ext.asyncio import create_async_engine
    engine = create_async_engine(settings.DATABASE_URL, pool_size=20, max_overflow=10)
else:
    # Use existing lightweight SQLite / CaseStore
    SQLITE_PATH = "backend/database/relational/procurement_cases.db"
```

### 3. Vector Store Adapter (`backend/app/rag/vector_store.py`)
```python
if settings.DATA_MODE == "production" and settings.QDRANT_HOST != ":memory:":
    client = QdrantClient(
        url=settings.QDRANT_HOST,
        api_key=settings.QDRANT_API_KEY,
        prefer_grpc=True
    )
else:
    client = QdrantClient(location=":memory:")
```

---

## 🔒 Security, Compliance & Data Governance

When operating with live pharmaceutical procurement data, the system must adhere to strict regulatory compliance standards:

1. **GxP & 21 CFR Part 11 Compliance:**
   - All human approvals (`/approval/decide`) must be digitally signed with user identity, timestamp, IP address, and cryptographic checksum.
   - Case records in PostgreSQL must maintain append-only audit tables (`case_audit_log`).
2. **Data Confidentiality (Non-Disclosure Agreements):**
   - Negotiated vendor pricing and confidential SLA rebates must be encrypted at rest using AES-256 (via AWS KMS or Azure Key Vault).
   - Multi-tenant tenant-isolation schemas in PostgreSQL prevent data bleeding across buyer organizations.
3. **Data Residency & Sovereign Compliance:**
   - In accordance with the Digital Personal Data Protection Act (DPDPA 2023) and CDSCO guidelines, all healthcare and vendor records for Indian operations must reside within India-region data centers.

---

## 🏁 Summary Checklist for Production Readiness

- [ ] Deploy managed PostgreSQL instance and execute Alembic migrations.
- [ ] Spin up dedicated Qdrant Cloud cluster with production API keys.
- [ ] Set up Neo4j instance and load verified regulatory ontology.
- [ ] Implement automated ETL pipeline for daily NPPA DPCO Gazette updates.
- [ ] Integrate openFDA and MCA21 verification into `web_scraper.py`.
- [ ] Connect CLM webhook listener for automated contract ingestion.
- [ ] Configure OpenTelemetry / Langfuse distributed tracing for LangGraph.
- [ ] Execute parallel shadow-run validation against 100 historical procurement cases.
- [ ] Verify GxP 21 CFR Part 11 audit logging compliance.
- [ ] Retain mock data suite for zero-dependency CI/CD test runners.
