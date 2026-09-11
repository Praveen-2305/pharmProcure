# Mock Vector Database (`vector/`)

This directory documents the **Qdrant Vector Database** implementation for AutonoSource.

---

## 📐 Vector Specifications

- **Engine:** Qdrant Client (In-memory `:memory:` for testing/local, or `localhost:6333` for server mode).
- **Collection Name:** `procurement_contracts`
- **Vector Dimension:** `384` (compatible with `all-MiniLM-L6-v2` and lightweight local dense embeddings).
- **Distance Metric:** `Cosine` (ranges from -1.0 to +1.0, normalized to [0.0, 1.0]).

---

## 🔍 Payload Schema

Each point in the collection stores structured payload attributes alongside the vector:
- `clause_id`: Unique identifier for the contract clause or regulatory section.
- `text`: Raw paragraph text.
- `source_doc`: Filename of the source document (e.g. `Apex_BioLogistics_SLA.md`, `who_trs1025_annex7_cold_chain.pdf`).
- `page_number`: Extracted page number.
- `category`: Functional tag (e.g. `liability_cap`, `temperature_transit`, `indemnity`).
- `source_priority`: Reliability weight (e.g. 1.0 for Schedule M, 0.85 for WHO TRS, 0.60 for vendor draft).
- `vendor_name`: Associated vendor name (if contract document).

---

## 📄 File: `sample_vector_payloads.json`

Contains realistic vector payload samples used during offline retrieval, test suites, and mock evaluations.
