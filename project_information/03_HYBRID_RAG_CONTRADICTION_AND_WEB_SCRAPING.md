# AutonoSource (pharmProcure) — Hybrid RAG, Contradiction Engine & Web Scraping

**Document Version:** 2.1.0  
**Target Audience:** AI Researchers, Search Engineers, Compliance Architects  
**Core Technologies:** Qdrant Vector Store, NetworkX Property Graph, Reciprocal Rank Fusion (RRF), Tavily / HTTP Web Scraper  
**Implementation Source:** `backend/src/rag_pipeline/`  

---

## 1. Dual-Retriever Architecture

AutonoSource implements a hybrid retrieval paradigm combining unstructured semantic search with structured ontological graph traversals:

```
                           [Procurement Query & Context]
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
         [Vector Store Retriever]                  [Graph RAG Retriever]
         - Technology: Qdrant                      - Technology: NetworkX
         - Dimension: 768-dim Dense                - Schema: MultiDiGraph
         - Chunks: Contracts & Standards           - Nodes: Vendors, Acts, SLAs
         - Metric: Cosine Similarity               - Traversal: Shortest Path
                    │                                         │
                    └────────────────────┬────────────────────┘
                                         ▼
                         [4-Step Hybrid Fusion Engine]
                         1. Score Normalization
                         2. Contradiction Detection
                         3. Legal Authority Tie-Breaking
                         4. Unified Confidence Scoring
```

---

## 2. Graph Database Architecture: NetworkX & Neo4j Integration

### 2.1 Why NetworkX In-Memory Graph Engine?
In AutonoSource, the knowledge graph represents statutory acts, manufacturing licenses, and cold-chain relationships. NetworkX was chosen as the primary graph engine for:
1. **Zero External Dependencies:** Runs natively in Python memory with zero Docker, Java JVM, or port dependencies.
2. **Ultra-Low Latency:** In-memory graph traversals complete in **< 0.5 milliseconds**, drastically faster than network socket roundtrips to an external graph daemon.
3. **True Graph Traversal:** Supports complex graph operations:
   - `nx.single_source_shortest_path_length(G, vendor, cutoff=2)`
   - Multi-hop neighbor inspection
   - Edge-weight traversal algorithms

### 2.2 Storage Formats
The graph is persisted to disk under [`backend/processed_data/`](../backend/processed_data/):
- **`knowledge_graph.graphml`:** International standard XML-based format for graph data. Can be opened directly in Gephi, Cytoscape, or imported into Neo4j.
- **`knowledge_graph.json`:** Node-link adjacency list for fast, lightweight loading into memory without XML parsing overhead.

### 2.3 Loading into External Neo4j (Optional)
If an enterprise deployment requires a distributed Neo4j cluster:
```cypher
// Import the GraphML file directly into Neo4j
CALL apoc.import.graphml("knowledge_graph.graphml", {})
```

---

## 3. 4-Step Hybrid Fusion & Contradiction Resolution Algorithm

Implemented in [`backend/src/rag_pipeline/fusion.py`](../backend/src/rag_pipeline/fusion.py).

### Step 1: Score Normalization
Each retriever outputs scores on different numerical scales:
- **Vector Score (`S_vec`):** Cosine similarity between query embedding and chunk vector:
  ```
  normalized_vector_score = (S_vec - S_min) / (S_max - S_min)
  ```
- **Graph Score (`S_graph`):** Inversely proportional to the shortest path distance from the vendor node to the regulatory standard:
  ```
  graph_score = 1 / (1 + path_length)
  ```

### Step 2: Legal Source Priority Hierarchy & Weighting
In legal disputes, private contract terms do not hold equal weight with statutory legislation. AutonoSource enforces an authoritative priority hierarchy (`W_s`):

| Source Classification | Priority Weight (`W_s`) | Legal Rationale |
| :--- | :---: | :--- |
| **Primary Legislation / Act** | `1.20` | Drugs and Cosmetics Act 1940; statutory law superseding all private terms. |
| **Statutory Regulatory Graph** | `1.00` | Verified CDSCO manufacturing standards (Schedule M, WHO TRS 1025). |
| **Vector Store (Official Publications)** | `0.85` | Unstructured regulatory guidelines and government gazettes. |
| **Vector Store (Vendor RFP / Claims)** | `0.60` | Vendor self-declarations; lowest authority in compliance disputes. |

The final combined score for each retrieved fact is calculated as:
```
final_score = retriever_score * W_s
```

### Step 3: Contradiction Detection Algorithm
When facts from Vector and Graph touch the same entity or operational constraint, semantic and numerical contradiction checks are applied:

1. **Cold-Chain Temperature Contradiction:**
   - Vector Contract Clause: *"Ambient transport between 15°C and 25°C permitted."*
   - Graph WHO Standard: *"WHO TRS 1025 Annex 7 requires strict continuous 2°C to 8°C."*
   - **Resolution:** Engine flags `contradiction_flag = True`. The WHO standard is marked `is_primary = True`, while the vendor's clause is marked `is_primary = False` with `conflicts_with = fact_id`.

2. **Compliance Track Record Contradiction:**
   - Vector Vendor Claim: *"Zero regulatory findings or warning letters across global operations."*
   - Graph/Web Scraper: *"State Drug Controller show-cause notice 2024 for batch documentation lapse."*
   - **Resolution:** The regulatory notice prevails; the vendor claim is flagged as an unresolved discrepancy.

### Step 4: Overall Confidence Scoring
Overall confidence (`C`) is computed from evidence completeness, penalized for unresolved contradictions:
```
confidence = clamp(mean(final_scores) - (0.15 * has_contradictions), 0.10, 1.00)
```

---

## 4. Deterministic Regulated Pricing Subsystem

Located in [`backend/src/db/pricing.py`](../backend/src/db/pricing.py):

1. **Statutory Authority:** Drugs (Prices Control) Order (DPCO), 2013 under Section 3 of the Essential Commodities Act, 1955.
2. **Catalog Path:** `backend/processed_data/pricing_ceiling_catalog.json` (16 scheduled drug formulations).
3. **Evaluation Statuses:**
   - **`WITHIN_CEILING`:** Quoted price <= statutory ceiling price.
   - **`EXCEEDS_CEILING`:** Quoted price > statutory ceiling price. Automatically triggers `HIGH` overall risk.
     ```
     excess_amount = quoted_price - ceiling_price
     ```
   - **`INDETERMINATE`:** Novel or custom synthesis formulation not listed in Schedule I. Applies a `-0.15` penalty to overall confidence.

---

## 5. Web Scraping & Regulatory Docket Crawler

Implemented in [`backend/src/rag_pipeline/web_scraper.py`](../backend/src/rag_pipeline/web_scraper.py):

1. **Target Search Signals:**
   - **Regulatory Warnings:** Circulars, FDA warning letters, show-cause notices (`"{vendor_name} regulatory warning recall CDSCO FDA"`).
   - **Litigation Records:** Judicial court filings, arbitration matters, commercial defaults.
   - **Product Recalls:** Substandard batch notices, cold-chain excursion reports.
   - **News Sentiment:** Categorized into `Positive`, `Neutral`, or `Adverse`.

2. **Execution Tiers:**
   - **Tier 1 (Live Tavily API):** Runs targeted web queries when `TAVILY_API_KEY` is configured in `.env`.
   - **Tier 2 (Live HTTP Search via `httpx`):** Queries public search endpoints directly with zero external API key requirements.
   - **Tier 3 (Domain Regulatory Registry):** Curated ground-truth dossiers for core entities (*BioGen Diagnostics*, *Apex BioLogistics*, *Global Pharma Logistics*, *Nova Biologics*, *MediSynth*).
   - **Tier 4 (Clean Verification Baseline):** Negative verification against official judicial and regulatory registries for unknown vendors.

3. **Risk Scorer Integration:**
   - Scraped regulatory warnings automatically escalate **Compliance Risk** to `HIGH` or `MEDIUM` in [`scorer.py`](../backend/src/agents/scorer.py).
   - Scraped commercial litigation escalates **Financial Risk** and is cited in `financial_rationale`.
   - Scraped sources are cited in `evidence_summary` in the final report.
