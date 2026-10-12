## ABSTRACT

AutonoSource (pharmProcure) is a multi-agent procurement risk and vendor intelligence
platform designed to improve decision-making in highly regulated pharmaceutical
supply chains. The project demonstrates a hybrid Retrieval-Augmented Generation
(RAG) approach that combines a dense vector retriever (Qdrant) with a NetworkX
knowledge graph to provide high-recall retrieval while preserving statutory and
relational context. The platform orchestrates specialized LangGraph agents — Planner,
RAG, Scraper, Scorer, Critic, and Writer — to run parallel evidence collection, perform
deterministic pricing audits in Indian Rupees (INR) against DPCO 2013 ceilings, detect
and reconcile contradictions, and produce explainable executive dossiers. Redis-based
cache-augmented generation and revision loops improve latency and report confidence.

Core contributions include: a reproducible hybrid retrieval pipeline, an explicit
four-step fusion algorithm for contradiction resolution, deterministic statutory pricing
checks in INR, and an auditable multi-agent orchestration pattern for procurement
investigations.

Keywords: procurement intelligence, hybrid RAG, LangGraph agents, DPCO 2013, INR,
contradiction detection, cache-augmented generation, Qdrant, NetworkX.
