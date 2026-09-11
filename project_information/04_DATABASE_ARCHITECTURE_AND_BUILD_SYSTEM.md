# AutonoSource (pharmProcure) — Multi-Database Architecture & Build System

**Document Version:** 2.1.0  
**Storage Hub:** `backend/database/`  
**Build Orchestrator:** `backend/build/build_all.py`  
**Audience:** Backend Engineers, Database Administrators, Autonomous Agents  

---

## 1. Unified Multi-Database Hub (`backend/database/`)

AutonoSource consolidates all persistence and static reference layers into a clean, modular structure under `backend/database/`:

```
backend/database/
├── relational/             # SQLite database & serialized case audit ledger
│   ├── procurement_cases.db# SQLite table storing active and historical procurement cases
│   ├── cases.json          # Pre-seeded JSON snapshot of the 5 baseline case studies
│   └── README.md
├── vector/                 # Dense 384-dimensional vector database snapshot
│   ├── vector_embeddings.json  # Serialized vector embeddings & text chunk payloads
│   ├── collections_metadata.json# Qdrant collection parameters and index statistics
│   └── README.md
├── graph/                  # NetworkX Property Graph database
│   ├── knowledge_graph.graphml # Canonical XML GraphML format (Gephi / Neo4j compatible)
│   ├── knowledge_graph.json    # Fast node-link JSON format
│   └── README.md
├── pricing/                # Regulated price ceiling database
│   ├── pricing_ceiling_catalog.json# NPPA DPCO 2013 scheduled ceiling catalog (16 items)
│   └── README.md
├── contracts/              # Reference legal contracts and SLA agreements
│   ├── Apex_BioLogistics_SLA.md
│   ├── NovaVaccines_ColdChain_Agreement.md
│   ├── sample_pharma_msa.txt
│   └── README.md
└── README.md               # Master database hub documentation
```

---

## 2. Deep Dive: The 5 Specialized Database Subsystems

### 2.1 Relational Database (`backend/database/relational/`)
- **Technology:** SQLite 3 (`procurement_cases.db`) + in-memory indexing via `CaseStore` ([`session.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/app/db/session.py)).
- **Table Schema (`procurement_cases`):**
  ```sql
  CREATE TABLE IF NOT EXISTS procurement_cases (
      procurement_id TEXT PRIMARY KEY,
      vendor_name TEXT NOT NULL,
      deal_size REAL NOT NULL,
      status_json TEXT NOT NULL,
      report_json TEXT,
      approval_json TEXT,
      created_at TEXT NOT NULL
  );
  ```
- **Operational Flow:**
  - On startup, `CaseStore` loads existing cases from SQLite. If the table is empty, it automatically seeds the 5 canonical case studies.
  - Every case submission via `POST /procurement/submit` or approval decision via `POST /approval/{id}/decide` is persisted immediately to SQLite.
  - Also exports a serialized `cases.json` ledger for external reporting and review.

---

### 2.2 Vector Database (`backend/database/vector/`)
- **Technology:** Qdrant Vector Store (`procurement_contracts` collection) operating in-memory or connected to remote Qdrant hosts.
- **Embedding Pipeline Specs ([`embedding_pipeline.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/app/rag/embedding_pipeline.py)):**
  - **Vector Dimension:** `384` dimensions.
  - **Distance Metric:** `Cosine`.
  - **Chunking Strategy:** `1000` character sliding window with `150` characters overlap.
  - **Chunk Count:** `370` verified chunks indexed across all regulatory standards and contracts.
- **Serialization:**
  - `vector_embeddings.json`: Serialized snapshot of document chunks with sample embedding vectors and metadata.
  - `collections_metadata.json`: Index parameters (collection name, vector size, distance metric).

---

### 2.3 Property Graph Database (`backend/database/graph/`)
- **Technology:** NetworkX `MultiDiGraph` ([`graph_store.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/app/rag/graph_store.py)).
- **Entities & Nodes:**
  - `RegulatoryStandard` (Schedule M GMP, CDSCO authority)
  - `StorageStandard` (WHO TRS 1025 Annex 7, 2°C to 8°C cold chain)
  - `PrimaryLegislation` (Drugs and Cosmetics Act 1940)
  - `PriceRegulation` (DPCO 2013, NPPA)
  - `Vendor` (BioGen Diagnostics, Global Pharma Logistics, Apex BioLogistics, Nova Biologics, MediSynth)
- **Relationships & Edges:**
  - `COMPLIES_WITH`, `HOLDS_LICENSE`, `CERTIFIED_FOR`, `GOVERNED_BY`, `DISPUTED_COMPLIANCE`, `CITED_IN`.
- **Formats:**
  - `knowledge_graph.graphml`: Standard XML GraphML for tool interchange.
  - `knowledge_graph.json`: Adjacency list for fast in-memory loading without XML overhead.

---

### 2.4 Regulated Pricing Catalog (`backend/database/pricing/`)
- **Technology:** JSON Catalog (`pricing_ceiling_catalog.json`).
- **Statutory Authority:** NPPA DPCO 2013 under Section 3 of Essential Commodities Act, 1955.
- **Formulations Covered:** 16 critical drugs including Paracetamol, Amoxicillin, Metformin, Ciprofloxacin, Azithromycin, Insulin Glargine, Enoxaparin, Remdesivir, and Trastuzumab.

---

### 2.5 Contracts Registry (`backend/database/contracts/`)
- **Contents:** Verified sample pharmaceutical agreements used for evaluation:
  - `Apex_BioLogistics_SLA.md`: Cold-chain distribution agreement containing controversial ambient clause 2.2.4.
  - `NovaVaccines_ColdChain_Agreement.md`: High-compliance vaccine agreement mandating IoT active tracking.
  - `sample_pharma_msa.txt`: Master Services Agreement with balanced indemnification and 30-day cure period.

---

## 3. Master All-In-One Build System: `build_all.py`

Implemented in [`backend/build/build_all.py`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/build/build_all.py).

### 3.1 Idempotent Clean Rebuild Behavior
Whenever `build_all.py` is executed:
1. **Automatic Purge:** Detects if `backend/database/` already exists, purges old generated databases to prevent stale data drift.
2. **Re-creation:** Fresh subdirectories (`relational/`, `vector/`, `graph/`, `pricing/`, `contracts/`) are created.
3. **Sequential Pipeline Execution:**
   - Runs `build/database/seed_database.py` -> initializes SQLite database and dumps `cases.json`.
   - Runs `build/rag/ingest_documents.py` -> chunks 9 source documents, generates 370 embeddings, populates Qdrant.
   - Runs `build/graph/build_knowledge_graph.py` -> constructs 12 nodes, 14 edges, outputs GraphML and JSON.
   - Copies DPCO pricing benchmarks to `database/pricing/`.
   - Indexes reference contracts to `database/contracts/`.
   - Generates database documentation.

### 3.2 Command-Line Execution
```bash
# Clean and rebuild all 5 databases at once
python backend/build/build_all.py

# Or run individual modules:
python backend/build/database/seed_database.py
python backend/build/rag/ingest_documents.py
python backend/build/graph/build_knowledge_graph.py
```
