# AutonoSource (pharmProcure) — Hybrid RAG, Contradiction Engine & Web Scraping

**Document Version:** 3.0.0  
**Target Audience:** AI Researchers, Search Engineers, Compliance Architects  
**Core Technologies:** Qdrant Vector Store, NetworkX Property Graph (5,757 nodes), 4-Step Fusion Engine, Tavily / Regulatory Web Scraper  
**Implementation Source:** `backend/src/rag_pipeline/` & `backend/src/agents/`  

---

## 1. Dual-Retriever Architecture

AutonoSource implements a hybrid retrieval paradigm combining unstructured semantic search with structured topological graph traversals:

```
                           [Procurement Query & Context]
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
         [Vector Store Retriever]                  [Graph RAG Retriever]
         - Technology: Qdrant                      - Technology: NetworkX MultiDiGraph
         - Dimension: 768-dim Dense                - Scale: 5,757 Nodes, Multi-entity
         - Chunks: Contracts & Standards           - Nodes: Vendors, Acts, SLAs, Rules
         - Metric: Cosine Similarity               - Traversal: Shortest Path & Neighborhood
                    │                                         │
                    └────────────────────┬────────────────────┘
                                         ▼
                          [4-Step Hybrid Fusion Engine]
                          1. Score Normalization
                          2. Legal Source Priority Weighting
                          3. Contradiction Detection
                          4. Unified Confidence Scoring
```

---

## 2. Graph Database Architecture: NetworkX (5,757 Nodes)

### 2.1 Why NetworkX In-Memory Property Graph?
In AutonoSource, the knowledge graph represents statutory acts, manufacturing licenses, and cold-chain relationships. NetworkX was chosen as the primary graph engine for:
1. **Zero External Dependencies:** Runs natively in Python memory with zero external daemon requirements.
2. **Ultra-Low Latency:** In-memory graph traversals complete in **< 0.5 milliseconds**, drastically faster than network socket roundtrips to an external graph daemon.
3. **Scale & Depth:** Houses **5,757 nodes** mapping the Drugs and Cosmetics Act 1940, Schedule M GMP, DPCO 2013, WHO TRS 1025, and pharmaceutical vendor entities.
4. **Multi-Tier Matching:** The retriever executes exact-match, lowercase substring match, and token-intersection search across node IDs, types, and labels to ensure comprehensive coverage.

### 2.2 Storage Formats under `backend/processed_data/graph/`
- **`knowledge_graph.graphml`:** International standard XML-based format for graph data. Can be inspected in Gephi, Cytoscape, or imported into Neo4j.
- **`knowledge_graph.json`:** Node-link adjacency list for fast, lightweight loading into memory without XML parsing overhead.

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
When facts from Vector and Graph touch the same operational constraint, semantic and numerical contradiction checks are applied:

1. **Cold-Chain Temperature Contradiction:**
   - Vector Contract Clause: *"Ambient transport between 15°C and 25°C permitted."*
   - Graph WHO Standard: *"WHO TRS 1025 Annex 7 requires strict continuous 2°C to 8°C."*
   - **Resolution:** Engine flags `contradiction_flag = True`. The WHO standard is marked `is_primary = True`, while the vendor's clause is marked `is_primary = False` with `conflicts_with = fact_id`.

2. **Compliance Track Record Contradiction:**
   - Vector Vendor Claim: *"Zero regulatory findings or warning letters across global operations."*
   - External Intelligence: *"Active CDSCO show-cause notice issued regarding sterility failures."*
   - **Resolution:** Engine flags contradiction, assigns penalty to confidence score, and instructs Critic agent.

### Step 4: Confidence Penalty & Revision Trigger
If contradictions are detected:
```
overall_confidence = base_confidence * (1.0 - contradiction_penalty)
```
If `overall_confidence < 0.80`, the Critic agent autonomously triggers a revision loop back to the RAG and Scraper nodes.

---

## 4. Web Due Diligence & Relational Intel Engine

Implemented in [`backend/src/agents/scraper_agent.py`](../backend/src/agents/scraper_agent.py) and [`backend/src/agents/web_scraper.py`](../backend/src/agents/web_scraper.py):

1. **Relational Database Verification:**
   - First queries `CaseStore.get_vendor()` from `procurement_cases.db` to verify financial ratings, turnover, and license validity for the 50 registered Indian suppliers.
2. **Statutory Pricing Verification in INR:**
   - Evaluates quoted prices against the DPCO 2013 pricing reference catalog in Indian Rupees (INR / ₹).
3. **Prompt-Driven Live Due Diligence:**
   - Uses [`src/prompts/scraper_prompt.py`](../backend/src/prompts/scraper_prompt.py) to crawl external data sources (CDSCO notifications, FDA 483 inspection citations, NCLT insolvency dockets, and media alerts).
   - Includes rule-based regex fallback extraction if the external search engine is unavailable.
4. **Dossier Caching:**
   - Automatically caches synthesized intelligence into the `vendor_profiles` table inside SQLite for high-speed subsequent retrieval.
