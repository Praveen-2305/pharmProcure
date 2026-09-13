# AutonoSource (pharmProcure) — Multi-Database Architecture & Build System

**Document Version:** 3.0.0  
**Storage Hub:** `backend/processed_data/`  
**Build Orchestrator:** `backend/build/build_all.py` & `backend/build/seed_data.py`  
**Audience:** System Architects, Database Engineers, Autonomous Agents  

---

## 1. Unified Multi-Database Hub (`backend/processed_data/`)

AutonoSource organizes all persistence and reference layers into dedicated subdirectories under `backend/processed_data/`:

```
backend/processed_data/
├── sqlite/                     # Relational persistence layer
│   ├── procurement_cases.db    # SQLite database hosting all 6 core tables
│   └── procurement_cases.json  # Pre-seeded JSON snapshot of baseline cases
├── graph/                      # Topological knowledge graph
│   ├── knowledge_graph.graphml # 5,757-node canonical XML GraphML property graph
│   └── knowledge_graph.json    # Fast node-link JSON export
└── qdrant/                     # Dense vector database
    └── [collection directories]# On-disk Qdrant collection (768-dim Nomic vectors)
```

---

## 2. Deep Dive: The 6-Table Relational Schema (`sqlite/procurement_cases.db`)

Managed by `CaseStore` in [`backend/src/db/session.py`](../backend/src/db/session.py):

### 2.1 Table Definitions

1. **`vendors` (50 Registered Indian Suppliers):**
   ```sql
   CREATE TABLE IF NOT EXISTS vendors (
       vendor_id TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       tax_id TEXT UNIQUE,
       license_number TEXT,
       gmp_certified BOOLEAN DEFAULT 0,
       country TEXT DEFAULT 'India',
       risk_rating TEXT DEFAULT 'MEDIUM',
       annual_turnover REAL,
       credit_score INTEGER,
       created_at TEXT NOT NULL
   );
   ```

2. **`vendor_products` (100+ Catalog Items with INR Pricing):**
   ```sql
   CREATE TABLE IF NOT EXISTS vendor_products (
       product_id TEXT PRIMARY KEY,
       vendor_id TEXT NOT NULL,
       sku TEXT NOT NULL,
       name TEXT NOT NULL,
       active_substance TEXT,
       dosage_form TEXT,
       package_size TEXT,
       cold_chain_required BOOLEAN DEFAULT 0,
       unit_price REAL NOT NULL,
       currency TEXT DEFAULT 'INR',
       FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
   );
   ```

3. **`pricing_references` (DPCO 2013 Statutory Ceilings in INR):**
   ```sql
   CREATE TABLE IF NOT EXISTS pricing_references (
       reference_id TEXT PRIMARY KEY,
       formulation_name TEXT NOT NULL,
       category TEXT,
       ceiling_price REAL NOT NULL,
       unit TEXT NOT NULL,
       notified_date TEXT,
       source TEXT DEFAULT 'NPPA_DPCO_2013',
       currency TEXT DEFAULT 'INR'
   );
   ```

4. **`procurement_cases` (Procurement Lifecycle State):**
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

5. **`audit_logs` (Forensic GxP-Compliant Audit Trail):**
   ```sql
   CREATE TABLE IF NOT EXISTS audit_logs (
       log_id TEXT PRIMARY KEY,
       case_id TEXT NOT NULL,
       timestamp TEXT NOT NULL,
       event_type TEXT NOT NULL,
       actor TEXT NOT NULL,
       severity TEXT DEFAULT 'INFO',
       payload_json TEXT
   );
   ```

6. **`vendor_profiles` (Synthesized Web & Due Diligence Intelligence):**
   ```sql
   CREATE TABLE IF NOT EXISTS vendor_profiles (
       profile_id TEXT PRIMARY KEY,
       vendor_identifier TEXT UNIQUE NOT NULL,
       scraped_data_json TEXT NOT NULL,
       regulatory_warnings_json TEXT,
       financial_risk_indicators_json TEXT,
       last_scraped_at TEXT NOT NULL
   );
   ```

---

## 3. Vector Database (Qdrant & Nomic Embeddings)

- **Technology:** Local Qdrant Vector Store (`backend/processed_data/qdrant/`).
- **Embedding Pipeline Specs ([`embedding_pipeline.py`](../backend/build/embedding_pipeline.py)):**
  - **Model:** `nomic-ai/nomic-embed-text-v1.5` (768 dimensions).
  - **Distance Metric:** Cosine similarity.
  - **Index:** HNSW (`m=16, ef_construct=100`) for high-speed sub-millisecond nearest neighbor search.
- **Chunking Strategy:** `MarkdownTextSplitter` (1200 chunk size, 200 overlap) preserving structural context from `pymupdf4llm` PDF extractions.

---

## 4. Property Graph Database (NetworkX 5,757 Nodes)

- **Technology:** NetworkX `MultiDiGraph`.
- **Node Scale:** **5,757 nodes** mapping statutory acts, GMP guidelines, cold chain standards, and vendors.
- **Formats:**
  - `knowledge_graph.graphml`: Canonical XML GraphML format.
  - `knowledge_graph.json`: Serialized JSON graph export for fast loading.

---

## 5. Build Engine & Dataset Safety Rules

### 5.1 Dataset Preservation (Default Behavior)
The master builder ([`backend/build/build_all.py`](../backend/build/build_all.py)) safely detects existing datasets:
- If `processed_data/graph/knowledge_graph.graphml` (5,757 nodes) exists, it is **preserved** unless `--rebuild-graph` or `--force-clean` is passed.
- If `processed_data/qdrant/` exists, vector collections are **preserved** unless `--rebuild-vector` or `--force-clean` is passed.
- Relational tables and catalogs are upserted safely via [`backend/build/seed_data.py`](../backend/build/seed_data.py).

### 5.2 Build Commands

```bash
# Seed the 50 vendors directory and DPCO catalog into SQLite:
python backend/build/seed_data.py

# Standard build orchestrator (preserves existing heavy datasets):
python backend/build/build_all.py

# Run high-throughput multi-key Groq knowledge graph pipeline:
python backend/build/graph/build_kg_groq.py
```
