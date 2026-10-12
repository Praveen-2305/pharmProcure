## CHAPTER IV
## PROPOSED WORK MODULES

4.0 Overview
This chapter describes the proposed modules that implement the AutonoSource workflow.
Each module is described with responsibilities, inputs, outputs, and key design notes.

4.1 Module: Planner
4.1.1 Responsibility
- Classify the investigation scope (LIGHT vs FULL) based on deal size and case
  metadata.

4.1.2 Inputs
- Vendor metadata, deal amount (INR), case tags.

4.1.3 Outputs
- Investigation plan: requested retrievers, depth parameters, and primary evidence slots.

4.1.4 Design Notes
- Thresholds are configurable; default LIGHT threshold is INR 5,00,000.

4.2 Module: RAG Retriever
4.2.1 Responsibility
- Perform parallel retrieval across vector (Qdrant) and graph (NetworkX) stores and
  return ranked evidence passages and provenance paths.

4.2.2 Inputs
- Normalized query slots and plan parameters.

4.2.3 Outputs
- Ranked evidence items with source type, passage text, score, and provenance.

4.2.4 Design Notes
- Vector retriever focuses on textual recall; graph retriever returns path-based
  authoritative nodes.

4.3 Module: Scraper
4.3.1 Responsibility
- Execute targeted web intelligence searches, fetch regulatory alerts, and enrich
  vendor profiles with fresh data.

4.3.2 Inputs
- Vendor name, registration numbers, and targeted search templates.

4.3.3 Outputs
- Scraped evidence items, external URLs, and enriched vendor metadata.

4.4 Module: Scorer
4.4.1 Responsibility
- Aggregate evidence across four risk dimensions (Financial, Compliance, Contractual,
  Pricing) and compute an overall confidence score.

4.4.2 Inputs
- Ranked evidence items and retrieval provenance.

4.4.3 Outputs
- Per-dimension scores, overall confidence, and flagged low-confidence slots.

4.5 Module: Critic
4.5.1 Responsibility
- Review the draft report, detect contradictions and low-confidence slots, and
  orchestrate targeted revision loops when required.

4.5.2 Inputs
- Draft dossier, evidence bundling, and current confidence metrics.

4.5.3 Outputs
- Revision instructions to the RAG retriever or Scraper, or a finalized approval-ready
  dossier if confidence is sufficient.

4.6 Module: Writer
4.6.1 Responsibility
- Synthesize the final executive dossier including: executive summary, evidence
  appendix, `conflicts_with` pointers, and recommended actions.

4.6.2 Inputs
- Final evidence set, per-dimension scores, human approvals if present.

4.6.3 Outputs
- Structured dossier in Markdown and PDF-ready formats.

4.7 Module: Storage & Audit
4.7.1 Responsibility
- Persist case artifacts, evidence bundles, and approval decisions with timestamps for
  traceability.

4.7.2 Design Notes
- SQLite supports local development; migration to PostgreSQL is recommended for
  production workloads.

4.8 Integration Notes
- Modules expose clear REST endpoints and CLI runners for reproducible demo runs.
- Configuration is environment-driven via `backend/src/config.py`.

4.9 Chapter Summary
This chapter detailed each proposed work module, their inputs/outputs, and integration
points. Chapter V evaluates results from seeded test cases and discusses system
behaviour under typical scenarios.
