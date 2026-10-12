## CHAPTER I
## INTRODUCTION

1.0 Overview
AutonoSource (pharmProcure) is a proof-of-concept multi-agent platform that converts
procurement due-diligence into a structured, auditable, and explainable investigative
workflow. Built for heavily regulated pharmaceutical supply chains, the system focuses
on deterministic statutory compliance (including DPCO 2013 price ceilings in INR), cold-
chain integrity, and evidence-based vendor risk assessment.

1.1 The Case for an Autonomous Procurement Intelligence Platform
Traditional procurement tools and single-prompt LLM assistants often fail in regulated
domains because they cannot preserve investigative state, verify facts against authoritative
sources, or resolve contradictory evidence. Procurement analysts must frequently revise
their approach when new evidence emerges (for example, a contract clause contradicting
statutory storage requirements). AutonoSource addresses this by coordinating specialized
AI agents that run parallel retrievals, fuse evidence, and iterate until configurable
confidence thresholds are met.

1.1.1 Real-Time, Evidence-Driven Assistance
The platform accepts multimodal inputs — text, voice transcripts, and medical images —
and performs high-quality retrieval using a dense vector store (Qdrant) alongside a
NetworkX property graph that encodes statutory and relational knowledge. Evidence is
weighted by source authority, favoring statutes and regulatory guidance over vendor-
provided claims, which reduces hallucination and improves explainability.

1.2 Objectives of the System
The principal objectives of AutonoSource are:
- Deliver deterministic pricing audits against DPCO 2013 ceilings, expressed in INR.
- Detect and flag contradictions between vendor claims, contract clauses, and statutory
	requirements (e.g., SLA transit temperatures vs WHO cold-chain mandates).
- Provide a reproducible, auditable pipeline that archives evidence, revision history,
	and confidence scoring for each procurement case.
- Support human-in-the-loop governance where executive reviewers can approve,
	reject, or escalate findings with recorded rationale.

1.2.1 Advantages and Key Capabilities
Key advantages include:
- Multimodal Retrieval: Parallel vector and graph retrieval increases recall and preserves
	relational context that purely vector-based retrieval misses.
- Hybrid Fusion and Contradiction Resolution: A four-step fusion algorithm normalizes
	retriever scores, applies source weighting (statutes > graph ontology > vendor text),
	and computes confidence penalties when contradictions are present.
- Stateful Revision Loops: The Critic agent evaluates draft reports and, if confidence is
	below the configurable threshold (commonly 0.80), triggers targeted re-retrieval and
	refinement, allowing up to three revision attempts before final synthesis.
- Deterministic Pricing Audits: Integrated DPCO and local price catalogs enable
	deterministic classification of quotes as `WITHIN_CEILING`, `EXCEEDS_CEILING`, or
	`INDETERMINATE`.

1.3 Architectural Overview
The system uses a modular architecture with clear separation of concerns:
- Backend: FastAPI application hosting the LangGraph orchestration and REST APIs.
- Retrieval: Qdrant for dense embeddings and a 5,757-node NetworkX knowledge graph
	for statutory lookups and relational paths.
- Persistence: SQLite for local development seeds and case storage; production
	deployments should migrate to PostgreSQL for durability and concurrency.
- Caching & Sessions: Redis for session memory and cache-augmented generation to
	reduce repeated LLM calls and improve latency.
- Frontend: React + TypeScript dashboard for submission, review, and human approval.

1.4 System Workflow and Agent Roles
- Planner: Determines investigation scope (LIGHT vs FULL) using deal size and case
	metadata.
- RAG Agent: Runs parallel vector and graph retrieval to return prioritized evidence
	passages and graph paths.
- Scraper Agent: Performs targeted web intelligence, vendor profile aggregation, and
	pricing checks.
- Scorer: Aggregates evidence into multi-dimensional risk scores and computes an
	overall confidence metric.
- Critic: Reviews drafts and triggers revision loops when confidence is insufficient.
- Writer: Produces the final executive dossier with `conflicts_with` annotations and
	actionable recommendations.

1.5 Scope and Limitations
This repository delivers a research-grade proof-of-concept seeded with 50 vendor
records and example cases. It demonstrates design patterns for auditable, hybrid RAG
retrieval and multi-agent orchestration but is not production-hardened. Production
adoption requires secure key management, data governance, compliance review, and
additional LLM safety testing.

1.6 Chapter Summary
Chapter I introduced the motivation, objectives, architecture, and agent workflow for
AutonoSource. Subsequent chapters provide literature background, detailed
methodology, module-level design, evaluation, and recommendations for production
transition.
