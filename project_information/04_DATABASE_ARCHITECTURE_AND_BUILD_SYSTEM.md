# AutonoSource (pharmProcure) — Multi-Database Architecture & Build System

**Document Version:** 3.0.0  
**Storage Hub:** `backend/processed_data/`  
**Build Orchestrator:** `backend/build/build_all.py`  
**Audience:** Backend Engineers, Database Administrators, Autonomous Agents  

---

## 1. Unified Multi-Database Hub (`backend/processed_data/`)

AutonoSource consolidates all persistence and static reference layers into a clean, flat, modular structure under `backend/processed_data/`. The directory has been flattened from previous versions to eliminate redundant nested folders:

```
backend/processed_data/
├── procurement_cases.db        # SQLite table storing active and historical procurement cases
├── cases.json                  # Pre-seeded JSON snapshot of the baseline case studies
├── vector_embeddings.json      # Serialized vector embeddings & markdown chunks payload
├── collections_metadata.json   # Qdrant collection parameters and HNSW index statistics
├── knowledge_graph.graphml     # Canonical XML GraphML format (Gephi / Neo4j compatible)
├── knowledge_graph.json        # Fast node-link JSON format
└── pricing_ceiling_catalog.json# NPPA DPCO 2013 scheduled ceiling catalog
```

---

## 2. Deep Dive: The Specialized Database Subsystems

### 2.1 Vector Database (Qdrant & Nomic Embeddings)
- **Technology:** Qdrant Vector Store (`procurement_contracts` collection) operating in-memory or remote.
- **Embedding Pipeline Specs ([`embedding_pipeline.py`](../backend/build/embedding_pipeline.py)):**
  - **Embedding Model:** `nomic-ai/nomic-embed-text-v1.5` (via `sentence-transformers` & `einops`)
  - **Vector Dimension:** `768` dimensions.
  - **Distance Metric:** `Cosine`.
  - **Retrieval Index:** **HNSW** (Hierarchical Navigable Small World) explicitly configured (`m=16, ef_construct=100`) for high-speed, high-accuracy retrieval.
- **Chunking Strategy:** 
  - Utilizes LangChain's **`MarkdownTextSplitter`** (1200 chunk size, 200 overlap) to intelligently preserve semantic boundaries derived from `pymupdf4llm` extractions (headers, paragraphs, tables) rather than arbitrarily slicing text.

---

### 2.2 Property Graph Database (NetworkX)
- **Technology:** NetworkX `MultiDiGraph`.
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

### 2.3 Relational Database (SQLite)
- **Technology:** SQLite 3 (`procurement_cases.db`) + in-memory indexing via `CaseStore` ([`session.py`](../backend/src/db/session.py)).
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
  - On startup, `CaseStore` loads existing cases from SQLite. 
  - Every case submission via `POST /procurement/submit` is persisted immediately to SQLite.

---

### 2.4 Regulated Pricing Catalog (JSON)
- **Technology:** JSON Catalog (`pricing_ceiling_catalog.json`).
- **Statutory Authority:** NPPA DPCO 2013 under Section 3 of Essential Commodities Act, 1955.
- **Formulations Covered:** 16 critical drugs including Paracetamol, Amoxicillin, Metformin, Ciprofloxacin, Azithromycin, Insulin Glargine, Enoxaparin, Remdesivir, and Trastuzumab.

---

## 3. Master All-In-One Build System: `build_all.py`

Implemented in [`backend/build/build_all.py`](../backend/build/build_all.py).

### 3.1 Idempotent Clean Rebuild Behavior
Whenever `build_all.py` is executed:
1. **Automatic Purge:** Detects if `backend/processed_data/` already exists, purges old generated databases to prevent stale data drift.
2. **Sequential, Data-Dependent Pipeline Execution:**
   - **Step 1: RAG Vector Database Build:** Chunks documents using Markdown semantics, embeds them using Nomic 768-dim, and initializes the Qdrant HNSW index.
   - **Step 2: Knowledge Graph Database Build:** Constructs the graph ontology depending on entities extracted during the RAG phase.
   - **Step 3: Relational Database Build:** Seeds the SQLite database and dumps `cases.json` relying on fully formed structured data.
   - **Step 4: Pricing Database Build:** Copies the NPPA pricing catalogs.

### 3.2 Command-Line Execution
```bash
# Clean and rebuild all databases at once (Respects dependency order)
python backend/build/build_all.py
```
