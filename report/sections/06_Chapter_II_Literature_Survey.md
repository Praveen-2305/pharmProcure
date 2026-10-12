## CHAPTER II
## LITERATURE SURVEY

2.0 Overview
This chapter reviews prior art, standards, and research that directly influenced the
design decisions in AutonoSource. The literature is organized into technical building
blocks (speech recognition, large language models, and retrieval systems), regulatory
standards relevant to pharmaceutical procurement, and recent work on hybrid retrieval
and contradiction detection that motivated our fusion strategy.

2.1 Automatic Speech Recognition and Multimodal Input
2.1.1 Whisper and Low-Latency ASR
Radford et al.'s Whisper (2022) demonstrated large-scale, robust multilingual speech
recognition trained on diverse audio corpora, including noisy and accented speech.
For applications that accept voice input in operational settings, Whisper-like models
offer a practical trade-off between accuracy and generalization. AutonoSource adopts a
fast, low-latency STT component (Faster-Whisper or equivalent) to transcribe voice
interactions for downstream intent classification and retrieval.

2.1.2 Multimodal Integration
Modern assistant systems benefit from handling images (e.g., pill photos) alongside text
and voice. Multimodal encoders enable unified representations that improve entity
recognition, classification, and evidence extraction in clinical scenarios.

2.2 Large Language Models and Prompting Patterns
2.2.1 Transformer Architectures and Conversational AI
Transformers (Vaswani et al., 2017) underpin modern LLMs such as GPT and LLaMA. These
models are effective at reasoning, summarization, and generating human-like text when
paired with carefully designed prompts. AutonoSource uses LLMs as reasoning and
synthesizing engines while relying on deterministic backstops (databases, rule checks)
for statutory assertions and pricing arithmetic.

2.2.2 Safety, Hallucination, and Grounding
LLMs can hallucinate facts when asked about authoritative regulatory requirements or
numerical ceilings. The literature emphasizes grounding generated outputs with retrieved
evidence and deterministic checks. This practice shaped our design: the Writer agent
always enumerates source passages and cross-references deterministic pricing lookups.

2.3 Retrieval-Augmented Generation (RAG) and Hybrid Retrieval
2.3.1 Vector RAG and Semantic Search
Dense vector retrieval (embeddings + Qdrant) enables semantic similarity search, which
is powerful for free-text evidence discovery. However, vector methods alone do not
preserve legal or hierarchical relationships between statutes, nor do they provide
structured paths that explain authority.

2.3.2 Graph-Based Retrieval and Knowledge Graphs
Knowledge graphs encode relational edges and provenance that are crucial for legal and
contractual reasoning. NetworkX-style property graphs allow traversal of statutory
hierarchies, ontological precedence, and provenance tracking—features that improve
explainability when determining which source governs a conflict.

2.3.3 Hybrid Retrieval and Fusion Algorithms
Recent work advocates combining vector and symbolic/graph retrieval to gain recall and
relational structure. Our four-step fusion algorithm (score normalization, source
weighting, contradiction detection, and confidence penalty) follows this guidance to
produce reconciled evidence sets and to quantify uncertainty when sources disagree.

2.4 Contradiction Detection and Explainability
2.4.1 Automatic Contradiction Detection
Detecting conflicts between numeric constraints (e.g., temperature ranges) and
textual assertions (e.g., SLA clauses) requires both accurate extraction and semantic
comparison. The literature contains methods for structured slot extraction and numeric
comparison, which we apply to trigger critic-led revision loops when contradictions are
found.

2.4.2 Explainable Dossiers and Audit Trails
Accountability and auditability are critical in procurement. Research into explainable
AI and evidence-backed generation informs the requirement that all final recommendations
include explicit `conflicts_with` pointers and direct source citations.

2.5 Multi-Agent Orchestration and LangGraph
2.5.1 Agent-Based Workflows
The idea of splitting responsibilities across specialized agents—planning, retrieval,
scraping, scoring, critiquing, and writing—follows modular AI system design. LangGraph
and similar state-graph orchestrators permit clear workflow modeling, conditional
routing, and parallel execution, which are essential for efficient and auditable
investigations.

2.6 Regulatory and Domain Standards
2.6.1 Drugs and Cosmetics Act & Rules
The Drugs and Cosmetics Act, 1940, and supporting rules define manufacturing,
licensing, and distribution obligations. These statutes form authoritative sources in
our knowledge graph and are weighted highly in the fusion algorithm.

2.6.2 Schedule M and WHO Guidance
Schedule M (GMP) and WHO TRS 1025 Annex 7 (cold-chain standards) provide technical
specifications that often intersect with procurement clauses. These documents are
treated as primary statutory evidence when evaluating cold-chain compliance.

2.6.3 DPCO 2013 and Pricing Ceilings
DPCO 2013 price schedules, enforced by NPPA, are treated as deterministic pricing
references. The system checks quotes numerically against these ceilings to avoid
statutory non-compliance.

2.7 Gaps in Existing Work and Contributions
While prior research covers powerful retrieval and reasoning techniques, few works
combine deterministic statutory checks, hybrid retrieval fusion, and an auditable
revision loop in a procurement-specific context. AutonoSource contributes a
practical fusion pattern, a reproducible seeding pipeline for price and vendor data,
and a human-in-the-loop governance model tailored to statutory compliance.

2.8 Chapter Summary
This literature survey justified the architectural choices in AutonoSource: a hybrid
retrieval backbone, deterministic statutory checks, explicit contradiction handling, and
agent-based orchestration. Subsequent chapters describe requirements, design, and
implementation details that operationalize these concepts.

environments.

[2] IBM Watson Health (2015) — early AI applications in clinical decision support and
data integration.

[3] GPT-3 (Brown et al., 2020) — transformer architectures enabling reasoning and
conversational AI.

[4] Gemini (Google) — multimodal models for joint text and image understanding.

[5] LLaMA (Touvron et al., 2023) — efficient LLMs for reasoning under resource constraints.

Additional references: works on hybrid RAG, contradiction detection in regulatory text,
and system design patterns for multi-agent orchestration.
