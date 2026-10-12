AUTONOSOURCE — MULTI-AGENT PROCUREMENT RISK & VENDOR INTELLIGENCE PLATFORM (pharmProcure)
=====================================================================================

Author(s): Krishnaprasath SK, Kamalesh V

Abstract
--------

AutonoSource (pharmProcure) is a research-grade proof-of-concept platform that applies
multi-agent orchestration, hybrid retrieval-augmented generation, and deterministic
statutory checks to the problem of procurement risk assessment in pharmaceutical
supply chains. The system is engineered to combine high-recall semantic retrieval using
Qdrant with relation-preserving queries over a NetworkX knowledge graph. By
orchestrating specialized LangGraph agents—Planner, RAG, Scraper, Scorer, Critic, and
Writer—the platform constructs auditable, explainable dossiers that enumerate
evidence, detect contradictions, and produce a final recommendation that is suitable
for human review and regulatory scrutiny. Redis-backed cache-augmented generation
reduces repeated LLM calls and improves interactive latency while SQLite-seeded
datasets demonstrate deterministic pricing checks against the DPCO 2013 catalog.

Table of Contents
-----------------

1. Chapter I — Introduction
2. Chapter II — Literature Survey
3. Chapter III — Objectives and Methodology
4. Chapter IV — Proposed Work Modules
5. Chapter V — Results and Discussion
6. Chapter VI — Conclusions and Future Work
7. References
8. Appendices

Chapter I — Introduction
-------------------------

1.0 Overview

AutonoSource has been developed to address a practical and pressing need in regulated
procurement: the automation of investigative due diligence while preserving
explainability, auditability, and deterministic statutory checks. The procurement
process in pharmaceutical contexts often hinges on verifying regulatory compliance
documents, ensuring cold-chain integrity for temperature-sensitive products, and
matching quoted prices to statutory ceilings. Historically, these checks have been
performed manually by experienced analysts who synthesize evidence from diverse
sources—regulatory gazettes, vendor declarations, inspection reports, and contractual
clauses. AutonoSource codifies that investigative expertise into a repeatable, testable
software pipeline that assists analysts and provides a defensible audit trail for
decisions.

1.1 Motivation and Problem Statement

Procurement in regulated domains is inherently investigative. When a vendor submits
a quotation for a regulated medicine, an analyst is required to verify multiple aspects:
the statutory authorizations of the manufacturer, the physical handling and storage
provisions in contracts, the authenticity of pricing relative to published ceilings, and
the vendor's historical compliance records. Existing AI assistants and simple RAG
systems may retrieve plausible text but cannot reliably indicate legal authority, cannot
perform deterministic numeric checks against a canonical price catalog, and often fail
to resolve contradictions between multiple evidence sources. These shortcomings
create legal exposure and erode trust in automated assistance. AutonoSource seeks to
reduce this risk by combining evidence-based retrieval, deterministic checks, and a
revision-driven critique mechanism to ensure higher confidence before human
approval.

1.2 Design Principles

The system is guided by four core principles: explainability, determinism, modularity,
and reproducibility. Explainability requires that every final recommendation be
backed by explicit source passages and provenance paths. Determinism requires
that operations such as pricing checks be numeric and auditable—software should
return a definitive `EXCEEDS_CEILING` or `WITHIN_CEILING` when a catalog match is
found, rather than a probabilistic prose answer. Modularity ensures each agent and
adapter is independently testable: retrievers, scrapers, scorers, and writers are
clearly separated. Reproducibility emphasizes idempotent data ingestion and a
documented seed pipeline for vendor records, pricing catalogs, and statutory texts.

1.3 Scope and Limitations

AutonoSource is a POC intended to validate architectural patterns rather than a fully
audited production system. The repository contains 50 seed vendors and a sample of
regulatory documents sufficient to demonstrate workflows and evaluations. For
production deployment, additional engineering is required: secure credential storage,
formal data governance, legal sign-off for automated recommendations in live
procurements, and operational monitoring. Recognizing these constraints, the project's
deliverables include auditable logs and structured dossiers that facilitate human review
and regulator queries.

Chapter II — Literature Survey
------------------------------

2.0 Overview

This chapter synthesizes prior work in automatic speech recognition, large language
models, retrieval-augmented generation, knowledge graphs, and hybrid retrieval
methods, in addition to domain-specific regulations that informed AutonoSource's
design. The literature exposes both the technical potential and current limitations of
LLM-centric systems when applied to legally-sensitive decision-making.

2.1 Automatic Speech Recognition and Multimodal Inputs

Recent progress in automatic speech recognition (ASR), notably architectures such as
Whisper and optimized variants like Faster-Whisper, permit practical transcription of
spoken inputs in noisy, multi-accent settings. These capabilities are important in
operational workflows where procurement officers might capture oral vendor
statements, negotiate terms, or include audio-based evidence. AutonoSource
incorporates an STT pipeline to ensure voice interactions are captured and transcribed
accurately, enabling text-based retrieval and LLM reasoning.

2.2 Large Language Models and the Need for Grounding

Large language models have revolutionized summarization and drafting, but they are
not reliable authorities for factual legal or numeric claims. The literature and
operational experience consistently recommend grounding generated outputs with
retrieved passages and deterministic database checks. This principle directly
motivates the platform's separation of retrieval (evidence) from synthesis (writing)
and the insistence that the Writer enumerates its evidence and includes deterministic
backstops for pricing assertions.

2.3 Retrieval-Augmented Generation and Hybrid Retrieval

Vector retrieval excels at semantic recall but loses hierarchical and relational
context. Knowledge graphs preserve relations and provenance but may lack textual
coverage. Hybrid retrieval combines both approaches: vector retrieval finds relevant
textual passages, while graph retrieval supplies structured paths and precedence.
AutonoSource's four-step fusion algorithm (score normalization, source weighting,
contradiction detection, confidence penalty) operationalizes this combination and
provides numeric confidence metrics useful in downstream decision-making.

2.4 Contradiction Detection and Explainability

Detecting contradictions (e.g., SLA temperature ranges versus WHO cold-chain
requirements) requires structured extraction and semantic comparison. The literature
recommends using slot extraction models for critical legal and numeric fields and
applying deterministic comparisons for numeric slots. Explainability research also
recommends exposing provenance and scoring so that auditors can verify how a
conclusion was reached; this principle is implemented in the dossier design.

Chapter III — Objectives and Methodology
----------------------------------------

3.0 Executive Summary

This chapter articulates precise objectives and the methodology followed to implement
and evaluate AutonoSource. Objectives are categorized as primary (core functional
goals) and secondary (engineering and operational goals), and the methodology
follows iterative engineering phases designed to produce auditable and reproducible
outcomes.

3.1 Primary Objectives

The primary goals of AutonoSource are: (1) to implement a multi-agent investigative
workflow that composes and reconciles evidence from diverse retrieval subsystems,
(2) to perform deterministic pricing checks against DPCO 2013 price ceilings in INR,
and (3) to generate explainable dossiers with explicit provenance and `conflicts_with`
annotations sufficient for regulatory review.

3.2 Secondary Objectives and Engineering Targets

Secondary objectives include modular testability, idempotent seed ingestion for
datasets (vendors, pricing, statutory documents), and the ability to run the end-to-
end pipeline locally for demonstrations. Engineering targets included: average cache
hit latency under 10ms for repeated queries, and fresh retrieval end-to-end time
under 3–4 seconds for POC workloads.

3.3 Methodology — Phase Breakdown

The project followed five principal phases: requirement elicitation, high-level
architecture design, iterative implementation with modular tests, integration and
evaluation against seeded cases, and documentation and packaging for demonstration.
Each phase produced artifacts that were committed and versioned in the repository to
support auditability and reproducibility.

3.4 Requirements

Functional requirements emphasized evidence retrieval, numeric pricing checks,
human approval flows, and dossier export. Non-functional requirements emphasized
explainability, reproducibility, and acceptable interactive performance for a POC.
Security, compliance, and large-scale performance were identified as out-of-scope for
the POC but included in recommendations for future work.

3.5 Implementation and Testing

Implementations were developed in Python with FastAPI for backend services. The
LangGraph orchestrator models agent workflows. Unit tests covered deterministic
modules (pricing checks, numeric comparisons, and evidence normalization). Integration
tests validated end-to-end runs against seeded cases to confirm dossier completeness,
confidence scoring behavior, and revision-loop effectiveness.

Chapter IV — Proposed Work Modules
-----------------------------------

4.0 Overview

This chapter elaborates module-level responsibilities and design decisions, linking
each module's purpose to the project's objectives. Modules are intentionally small and
focused to maximize testability and to provide clear boundaries for future production
hardening.

4.1 Planner Module

The Planner classifies each incoming procurement case into LIGHT or FULL
investigation modes based on deal size and contextual metadata. For POC
configuration, the LIGHT threshold is set to INR 5,00,000. Planner outputs direct the
retriever depth, selection of scraper templates, and the maximum number of revision
loops permitted. Planner logic reduces unnecessary retrieval for low-value cases while
ensuring higher diligence for larger deals.

4.2 RAG Retriever

The RAG Retriever orchestrates parallel queries: dense semantic similarity search in
Qdrant and structured traversals in a NetworkX knowledge graph. Vector retrieval
prioritizes recall for natural language queries, while graph traversal supplies authoritative
statutory paths and relationship context, for example identifying that Schedule M
provisions override general vendor statements. Retrieved items include passage text,
source identifiers, scores, and provenance paths for downstream fusion and reporting.

4.3 Scraper Module

The Scraper executes targeted web searches using vendor names, registration IDs, and
domain-specific query templates. Its responsibilities include pulling regulatory alerts,
site inspection notices, and recent news items that could affect credibility or pricing.
Scraped content is normalized and stored with timestamps and source URLs to
preserve provenance for human auditors.

4.4 Scorer Module

The Scorer computes per-dimension risk scores across Financial, Compliance,
Contractual, and Pricing dimensions. The scoring algorithm aggregates evidence
weights, applies source authority multipliers, and yields a composite confidence
metric. Low-confidence slots are identified and packaged for critic review.

4.5 Critic and Revision Loops

The Critic is a specialized agent that inspects the draft dossier for contradictions,
gaps, or low-confidence slots. When problems are detected and revision limits permit,
the Critic issues targeted revision instructions to the RAG retriever or Scraper. These
loops can run up to three times, after which the dossier is either escalated for human
review or marked as final depending on policy.

4.6 Writer Module

The Writer synthesizes the final dossier in Markdown with explicit evidence citations,
`conflicts_with` pointers, and recommended actions. Writer templates enforce a
consistent structure ideal for conversion into Word or PDF formats for submission to
procurement committees.

4.7 Storage & Audit

All artifacts—evidence items, drafts, revision instructions, and final approvals—are
persisted with timestamps. For the POC, SQLite is used for simplicity; production
recommendations include migration to PostgreSQL and incorporation of immutable
audit ledgers for regulatory traceability.

Chapter V — Results and Discussion
----------------------------------

5.0 Overview

This chapter reports the findings from executing the AutonoSource pipeline on seeded
cases, presenting retrieval quality metrics, scoring behaviors, latency figures, and user
feedback from human reviewers who inspected generated dossiers.

5.1 Seeded Case Performance

Five canonical seed cases were used to exercise the system: a price breach scenario,
a cold-chain contradiction, an indeterminate pricing case, a vaccine prequalification
case, and a balanced scenario that required clause negotiation. These cases were
selected to validate the system's ability to detect statutory violations, surface
contradictions, and perform deterministic pricing audits.

5.2 Retrieval and Fusion Outcomes

Hybrid retrieval improved coverage: graph traversals surfaced statute nodes and
authority relationships that vector-only retrieval sometimes missed, while vector
retrieval captured paraphrased passages and vendor language more effectively.
Fusion normalized scoring across retrievers and produced calibrated confidence
metrics aligned with sampled human judgments in our evaluations.

5.3 Critic Effectiveness and Revision

The Critic agent successfully identified low-confidence slots and contradictions in the
majority of seeded cases. Targeted revision loops reduced uncertainty and improved
final confidence scores, validating the efficacy of controlled iterative refinement over
single-pass generation.

5.4 Performance and Scalability Observations

On local developer hardware, typical end-to-end runtimes for fresh retrieval ranged
from 1.5 to 4 seconds depending on retrieval depth; cache hits were under 10ms. For
larger corpora or heavy concurrent usage, Qdrant indexing and graph traversal need
performance tuning and likely sharding or distributed hosting to maintain interactive
latency.

5.5 User Feedback and Dossier Quality

Human reviewers valued the explicit evidence citations and `conflicts_with` pointers.
Where textual contradictions were ambiguous, reviewers requested improved extraction
rules—an actionable recommendation for further work.

Chapter VI — Conclusions & Future Work
--------------------------------------

6.0 Summary of Findings

The AutonoSource proof-of-concept demonstrates that hybrid retrieval and multi-agent
orchestration can materially improve evidence recall, contrast contradiction detection,
and produce explainable dossiers that support human decision-making. Deterministic
pricing audits provided a robust statutory check that reduced legal ambiguity in price
assessments when seeded price catalog entries were present.

6.1 Recommendations for Production

Key next steps towards production include: expanding the price catalog to reduce
indeterminate cases, implementing secure credential management, migrating persistent
storage to PostgreSQL with role-based access control, and conducting formal LLM
safety testing in the procurement domain.

6.2 Research Directions

Future research could focus on: improved contract clause extraction models, hybrid
vector-graph indexing strategies for scale, and automated mapping of catalog items to
commercial product identifiers to enable deterministic pricing at scale.

References
----------

- Radford, A., et al. Whisper: Robust Speech Recognition (2022).
- Brown, T. B., et al. Language Models are Few-Shot Learners (2020).
- Vaswani, A., et al. Attention Is All You Need (2017).
- Touvron, H., et al. LLaMA: Open and Efficient Foundation Models (2023).
- National Pharmaceutical Pricing Authority — DPCO 2013.
- WHO TRS 1025 — Guidance on cold-chain and storage.
- Drugs and Cosmetics Act, 1940 and Rules, 1945 — CDSCO.

Appendices
---------

Appendix A — Seed Data & Commands

- Seed the SQLite dataset: `python backend/build/seed_data.py`.
- Ingest regulatory documents into Qdrant: `python backend/build/ingest_rag_docs.py`.

Appendix B — Notable Files

- `backend/src/agents/planner.py`
- `backend/src/agents/rag_agent.py`
- `backend/src/agents/scraper_agent.py`
- `backend/src/agents/scorer.py`
- `backend/src/agents/critic.py`
- `backend/src/agents/writer.py`

Formatting Guidance for Word (Times New Roman)
-------------------------------------------

When copying this Markdown into Microsoft Word, apply the following styles for
consistency with academic reports: set body text to Times New Roman 12pt, headings
as: Chapter titles 18pt bold, Section headings 14pt bold, Subsection headings 12pt
bold. Use 1.15 line spacing and 1-inch margins. Ensure each chapter starts on a new
page when converting to PDF or Word.
