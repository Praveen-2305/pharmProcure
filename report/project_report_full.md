AUTONOSOURCE — MULTI-AGENT PROCUREMENT RISK & VENDOR INTELLIGENCE PLATFORM (pharmProcure)
=================================================================================================================

Author(s): Krishnaprasath SK, Kamalesh V

Abstract
--------

AutonoSource (pharmProcure) is a multi-agent investigatory platform designed to
systematically address procurement risk in highly regulated pharmaceutical supply
chains. Where conventional AI assistants rely on single-pass generative answers, this
work integrates hybrid evidence retrieval, deterministic statutory checks, and a
modular agent-based workflow to produce auditable, explainable dossiers intended for
human decision-makers. The architecture couples high-recall dense retrieval (Qdrant)
with relation-preserving graph traversals (NetworkX), orchestrated by LangGraph-driven
agents that plan investigations, fetch corroborating evidence, score risk along
multiple dimensions, iteratively critique drafts, and synthesize final reports. The
system incorporates Redis for cache-augmented generation to manage latency and uses
seeded datasets for deterministic pricing checks against statutory catalogs denominated
in Indian Rupees (INR). This report presents the project rationale, theoretical
foundations, methodology, module-level design, empirical evaluations on seeded
cases, and recommendations for future operationalization.

Table of Contents
-----------------

Chapter I — Introduction
Chapter II — Literature Survey
Chapter III — Objectives and Methodology
Chapter IV — Proposed Work Modules
Chapter V — Results and Discussion
Chapter VI — Conclusions and Future Work
References
Appendices

Chapter I — Introduction
-------------------------

1.0 Overview

Procurement in regulated industries such as pharmaceuticals requires a nuanced
combination of legal interpretation, numerical validation, and contextual judgment.
Buyers and procurement officers must reconcile statutory requirements, technical
standards for product handling, historical vendor behaviour, and the precise terms of
commercial contracts before making high-value decisions. Traditional manual workflows
are time-consuming and brittle; they are also difficult to scale and audit. AutonoSource
was conceived to formalize this investigative process: the platform translates manual
best-practices into a repeatable software pipeline that augments human judgment with
algorithmic evidence fusion. Rather than supplanting expert review, the platform aims
to accelerate evidence collection, reduce routine verification errors, and present
decision-ready dossiers that make the provenance of every conclusion explicit.

1.1 Motivation and Problem Statement

The central challenge addressed by this project is the reliable automation of
procurement due-diligence in contexts where incorrect decisions carry legal and public
health consequences. A core failure mode for modern LLMs is that they provide
plausible textual answers without explicit grounding, which is unacceptable in a
regulatory setting. Moreover, procurement often involves deterministic checks—such
as comparing a quoted unit price against a legally-enforced ceiling—that cannot be
left to probabilistic language models. By combining evidence retrieval, graph-based
provenance, and deterministic arithmetic backstops, AutonoSource provides a safer
and more defensible decision-support tool. The project is motivated by the need to
reduce both false negatives (failing to flag non-compliance) and false positives
(erroneously escalating routine cases), and to make the decision-making traceable to
documented sources.

1.2 Design Principles

The platform's architecture is informed by four design principles that respond to
both technical and regulatory demands. Explainability requires that every significant
assertion in a dossier be traceable to an explicit source passage and, where relevant,
to a traversal path through a knowledge graph that clarifies authority relationships.
Determinism demands that numeric checks and catalog comparisons be conducted by
software modules whose outputs are auditable and reproducible. Modularity ensures
that specialized tasks—retrieval, scoring, scraping, and writing—are implemented as
loosely coupled components that can be independently tested and improved. Finally,
reproducibility mandates idempotent data ingestion and versioned seed datasets so that
experiments and evaluations can be repeated and validated by independent reviewers.

1.3 Scope and Limitations

This report documents a research-grade proof-of-concept rather than a production
service. The repository is provisioned with a curated seed of fifty vendor records and
representative statutory texts, sufficient for demonstration and evaluation. Significant
work remains for production adoption, including robust secrets management, hardened
infrastructure for sensitive data, and comprehensive legal review. Nevertheless, the
POC intentionally emphasizes auditability and traceability, producing dossier artifacts
and structured logs to facilitate subsequent validation and certification efforts.

Chapter II — Literature Survey
------------------------------

2.0 Overview

This chapter situates AutonoSource within the broader landscape of retrieval,
language models, knowledge graphs, and applied regulatory automation. The review
highlights the practical trade-offs between recall and relational fidelity, the risks of
ungrounded generation, and the methodological advances that justify a hybrid
retrieval-and-fusion approach.

2.1 Speech, Multimodality, and Evidence Capture

Modern procurement workflows increasingly include multimedia evidence—voice
communications, scanned PDFs, and images of physical packaging. Advances in
automatic speech recognition (ASR) such as Whisper have made low-latency,
reasonably accurate transcription of oral interactions feasible. AutonoSource treats
voice and image inputs as first-class evidence modalities: audio is transcribed for
textual retrieval, while images (for example pill photos) can be routed to image
analysis models and their outputs indexed alongside textual evidence. This multimodal
capability broadens evidence coverage and reduces reliance on a single input form.

2.2 The Role and Limits of Large Language Models

Large Language Models have proven invaluable for synthesis, summarization, and
drafting, yet their outputs must be read as probabilistic text rather than authoritative
facts. The literature on hallucination and factuality underscores the need to separate
retrieval of evidence from the generative step. AutonoSource adopts this separation
explicitly: LLMs are used for drafting and rhetorical quality, while statutory claims and
numeric assertions are validated against deterministic sources. The Writer agent's
obligation to list supporting passages and catalog lookups is directly informed by this
body of work.

2.3 Retrieval Paradigms: Vector vs Graph

Vector retrieval excels at semantic matching and paraphrase-tolerant recall, enabling
the discovery of relevant passages that share meaning with a query but not exact
wording. In contrast, knowledge graphs preserve relationships and provenance,
allowing queries about authority, precedence, and legal hierarchy. Hybrid retrieval
combines these strengths: semantic search surfaces candidate passages while graph
traversal explains which statutory nodes carry higher authority. AutonoSource's
four-step fusion—normalizing scores, applying source-weighted multipliers, detecting
contradictions, and computing confidence penalties—translates hybrid retrieval into a
quantitative decision-making substrate.

2.4 Contradiction Detection and Slot-Based Extraction

Effective contradiction detection requires extracting structured slots (numeric ranges,
dates, liability caps) from text and comparing them across sources. Techniques from
information extraction and relation extraction are applied to identify slots reliably, and
deterministic comparators flag numeric mismatches while textual contradictions are
presented with supporting passages for human adjudication. Research in explainable
AI also recommends surfacing scoring granularity and provenance to facilitate audit
and dispute resolution; AutonoSource implements these recommendations in the
final dossier structure.

Chapter III — Objectives and Methodology
----------------------------------------

3.0 Objectives

The project defines clear, measurable objectives focused on producing an auditable
decision-support pipeline. Primary objectives include deterministic pricing audits
against DPCO 2013 price ceilings, hybrid evidence retrieval with provenance, and the
generation of human-reviewable dossiers that enumerate conflicts and confidence.
Secondary objectives attend to engineering quality: modular design, reproducible seed
pipelines, and demonstrable latency improvements through cache-augmented
generation.

3.1 Methodology

The chosen methodology is iterative and evidence-driven. We began with requirement
elicitation to capture functional needs and domain constraints, followed by a high-level
architecture that prioritized separation of concerns and auditability. Implementation
proceeded in modular sprints with unit tests for deterministic components and
integration tests for end-to-end flows. Evaluation used seeded canonical cases to
measure retrieval recall, pricing classification accuracy, confidence calibration, and the
efficacy of revision loops. All artifacts—seed data, test cases, and evaluation scripts—
are committed to the repository to enable reproducibility.

3.2 Evaluation Criteria

Evaluation combines quantitative metrics and qualitative review. Quantitatively, we
measured retrieval precision/recall on a sampling of labeled passages, deterministic
pricing accuracy for catalog-matched items, average end-to-end latency, and cache
hit rates. Qualitatively, domain experts reviewed dossiers to assess clarity, relevance,
and the utility of `conflicts_with` annotations for decision-making. This mixed-methods
approach balances the strengths of algorithmic measurement with human judgment in
mission-critical contexts.

Chapter IV — Proposed Work Modules
-----------------------------------

4.0 Overview

The platform decomposes the investigation into focused modules: Planner, RAG
Retriever, Scraper, Scorer, Critic, Writer, and Storage/Audit. Each module encapsulates
distinct responsibilities and exposes clear inputs and outputs to facilitate testability,
parallel execution, and independent improvement.

4.1 Planner

The Planner encapsulates policy and scope: it determines the depth of retrieval and the
extent of web scraping required for a given deal. By encoding governance preferences
and thresholds (for example, a LIGHT/FULL decision threshold), Planner minimizes
unnecessary computation on low-risk cases and ensures rigorous evidence collection
for high-risk deals. The Planner's decisions are themselves logged as part of the audit
trail, enabling retrospective analysis of workflow effectiveness.

4.2 RAG Retriever and Fusion

The RAG Retriever concurrently executes dense vector searches and graph traversals.
Vector search surfaces paraphrased or latently-related passages while graph traversal
returns authoritative nodes and relationship paths. Fusion reconciles these returns into
a ranked, scored evidence bundle that preserves provenance and quantifies source
authority. This bundle is the primary input for scoring and drafting.

4.3 Scraper and Enrichment

Where authoritative open-web sources are relevant—inspection notices, regulatory
alerts, news, or vendor press releases—the Scraper performs templated searches and
normalizes results into the evidence model. Timely scraping is important because
regulatory status can change between procurement cycles; scraped items are timestamped
and retained in the audit store to capture the evidence available at decision time.

4.4 Scorer and Decision Signals

Scoring synthesizes evidence into per-dimension risk assessments and a composite
confidence metric. Scoring rules explicitly encode source authority multipliers and
penalties for contradictions, providing an interpretable mapping from evidence to the
signals used by the Critic and Writer. The scoring module is designed for transparency
so that weights and rules can be adjusted and validated by domain experts.

4.5 Critic and Iterative Refinement

The Critic acts as an internal quality-control agent: it inspects drafts for evidence gaps
and contradictions and orchestrates targeted re-retrievals. The goal of the criticism
loop is not to achieve artificial certainty but to elevate the dossier to an acceptable
confidence level or to produce a clearly flagged case for human escalation when
ambiguities remain.

4.6 Writer and Dossier Synthesis

The Writer composes the final report, integrating narrative summaries with explicit
evidence citations and `conflicts_with` markers. The structured output is deliberately
friendly for conversion to Word or PDF formats, with standard headings, appendices
for raw evidence, and an executive summary designed to support procurement
committee decision-making.

Chapter V — Results and Discussion
----------------------------------

5.0 Empirical Evaluation

Evaluation focused on seeded, canonical cases chosen to exercise statutory pricing
checks, cold-chain contradictions, and indeterminate catalog mappings. The hybrid
retrieval approach increased coverage of authoritative passages while maintaining
semantic recall for paraphrased content. Fusion produced confidence metrics that
correlated with human judgments in the sampled evaluations, and critic-driven revisions
reduced ambiguous cases.

5.1 Observations on Retrieval and Fusion

Graph retrieval consistently surfaced nodes representing statutory authority and
precedence, which helped to prioritize legal texts in the fusion stage. Vector retrieval
complemented the graph by locating paraphrased or contextually relevant passages.
Together they produced richer evidence bundles than either method alone, enabling
more defensible dossiers.

5.2 Critic Loops and Human Review

The Critic's targeted revision instructions were effective at closing many evidence
gaps without requiring full manual re-investigation. However, ambiguous contract
language remained a significant source of residual uncertainty, underscoring the
importance of domain-specific extraction models and human adjudication for edge
cases.

5.3 Performance and Practical Considerations

For POC workloads, cache hits were sub-10ms and fresh retrievals completed in a
few seconds. Scaling to larger datasets and concurrent workloads will require careful
attention to vector index sharding, graph partitioning, and asynchronous orchestration
to maintain interactive responsiveness.

Chapter VI — Conclusions & Future Work
--------------------------------------

6.0 Conclusions

AutonoSource demonstrates that hybrid retrieval, deterministic checks, and
agent-based orchestration can materially improve the quality and defensibility of
procurement decision-support artifacts. The system prioritizes traceability and audit
and offers a pathway to reduce routine verification effort while preserving human
governance for final approvals.

6.1 Future Directions

Key investments to move toward production include expanding and canonicalizing
pricing catalogs, improving contract clause extraction, implementing robust secrets
and credential management, migrating persistent storage to a production-grade
database, and conducting formal safety and legal reviews. Research directions also
include exploring hybrid index architectures for scale and automated canonical
identifier mapping to reduce indeterminate pricing cases.

References
----------

Radford, A., et al. Whisper: Robust Speech Recognition (2022).
Brown, T. B., et al. Language Models are Few-Shot Learners (2020).
Vaswani, A., et al. Attention Is All You Need (2017).
Touvron, H., et al. LLaMA: Open and Efficient Foundation Models (2023).
National Pharmaceutical Pricing Authority — DPCO 2013.
WHO TRS 1025 — Guidance on cold-chain and storage.
Drugs and Cosmetics Act, 1940 and Rules, 1945 — CDSCO.

Appendices
---------

Appendix A — Seed Data & Commands

Seed the SQLite dataset: `python backend/build/seed_data.py`.
Ingest regulatory documents into Qdrant: `python backend/build/ingest_rag_docs.py`.

Appendix B — Notable Files

`backend/src/agents/planner.py`
`backend/src/agents/rag_agent.py`
`backend/src/agents/scraper_agent.py`
`backend/src/agents/scorer.py`
`backend/src/agents/critic.py`
`backend/src/agents/writer.py`

Formatting Guidance for Word (Times New Roman)
-------------------------------------------

To preserve academic report styling when copying into Microsoft Word, set the body
text to Times New Roman 12pt, heading sizes as follows: chapter titles 18pt bold,
section headings 14pt bold, and subsection headings 12pt bold. Use 1.15 line spacing
and 1-inch margins. Insert a page break before each chapter and ensure that the
appendices are placed after the references.
