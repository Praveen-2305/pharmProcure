## CHAPTER III
## OBJECTIVES AND METHODOLOGY

3.0 Executive Summary
This chapter states the specific objectives of AutonoSource and documents the methodology
used to design, implement, test, and validate the multi-agent procurement risk platform.
All activities were aligned to produce an auditable, deterministic, and explainable
investigative pipeline for vendor due-diligence in regulated pharmaceutical procurement.

3.1 Objectives
3.1.1 Primary Objectives
- Build an auditable multi-agent pipeline that transforms procurement review into a
  structured investigative workflow.
- Implement deterministic pricing checks against DPCO 2013 ceilings expressed in INR.
- Detect contradictions between vendor declarations, contract clauses, and statutory
  documents and surface them with provenance and confidence metrics.

3.1.2 Secondary Objectives
- Provide modular components (retriever, scraper, scorer, critic, writer) that are
  independently testable and reusable.
- Demonstrate reproducible seeding of vendor, pricing, and statutory datasets for
  offline evaluation and benchmarking.

3.2 Methodology Overview
The development followed an iterative, evidence-driven engineering methodology with the
following phases: requirement analysis, design, implementation, testing & validation, and
deployment demonstration. Each phase produced artifacts (requirements, diagrams,
seed data, test cases) that were committed to the repository for traceability.

3.3 Requirement Analysis
3.3.1 Functional Requirements
- Case submission API accepting vendor metadata and deal amount in INR.
- Parallel retrieval of evidence from vector (Qdrant) and graph (NetworkX) stores.
- Deterministic pricing check against DPCO catalog entries.
- Human approval workflow with recorded decisions and rationale.

3.3.2 Non-Functional Requirements
- Explainability: every recommendation must include source passages and confidence.
- Performance: repeated queries should be served from cache with sub-10ms hits where
  possible; fresh evidence retrieval should be optimized for low-latency (target < 2s).
- Reproducibility: ingestion and seeding pipelines must be idempotent.

3.4 System Design
3.4.1 High-Level Architecture
- LangGraph orchestrator coordinates specialized agents in a directed state graph.
- Qdrant serves dense vector retrieval for semantic evidence recall.
- NetworkX knowledge graph encodes statutory hierarchies and provenance paths.
- Redis provides session memory and cache-augmented generation support.
- SQLite seeds provide deterministic test data; production migrations target PostgreSQL.

3.4.2 Data & Evidence Model
- Evidence items include: source id, passage text, confidence score, retrieval type
  (vector|graph|scraper), and provenance path.
- Contradiction objects are structured as: slot, left_value, right_value, conflict_type,
  detected_by, and confidence_penalty.

3.5 Implementation
3.5.1 Development Practices
- Incremental unit tests for retriever adapters, scoring logic, and writer templates.
- Use of modular prompts for reproducibility and safer generation boundaries.

3.5.2 Key Components
- `Planner`: scope decision (LIGHT vs FULL) based on deal size.
- `RAG Agent`: parallel retrieval and evidence ranking.
- `Scraper`: targeted web intelligence and vendor profile enrichment.
- `Scorer`: 4D risk rubric and aggregate confidence computation.
- `Critic`: evaluates and triggers revision loops when confidence < threshold.
- `Writer`: synthesizes executive dossier with `conflicts_with` pointers and appendices.

3.6 Testing & Validation
3.6.1 Unit and Integration Tests
- Unit tests target deterministic modules: pricing checks, numeric comparisons,
  evidence normalization, and small retriever mocks.
- Integration tests execute end-to-end pipeline on seeded cases and validate final
  dossier structure and confidence metrics.

3.6.2 Evaluation Metrics
- Precision/Recall on evidence retrieval (sampled human labels).
- Accuracy of deterministic pricing classification against seeded DPCO entries.
- Mean time-to-first-draft (end-to-end pipeline runtime) and cache hit rates.

3.7 Deployment & Demonstration
The POC includes runnable scripts and CLI tools (`backend/scripts/`) to seed data,
run end-to-end pipelines, and export PDF dossiers for demonstration. Dockerization is
documented in `backend/build/README.md` for reproducible demonstration environments.

3.8 Chapter Summary
This chapter clarified measurable objectives and described a methodology that ensured
the platform's outputs are deterministic, auditable, and explainable. The next chapter
details module-level design and responsibilities.
