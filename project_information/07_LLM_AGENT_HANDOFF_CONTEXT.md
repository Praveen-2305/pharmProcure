# LLM Agent Handoff & Technical Continuation Guide

**ATTENTION LLM AGENT:** If you are reading this document at the start of a new session, this is your strictly technical, un-sugared ground truth regarding the current state of the repository. Do not hallucinate paths or architectures. Rely strictly on the structures detailed below.

---

## 1. Directory Structure Rules & Ground Truth
- **Source Code:** `backend/src/` (Never use `backend/app/`).
- **Prompt Engineering:** `backend/src/prompts/` (`planner_prompt.py`, `scraper_prompt.py`, `scorer_prompt.py`, `critic_prompt.py`, `writer_prompt.py`).
- **Data Ingestion:** `backend/ingestion/` (`rag_and_graph/` for acts/SLA docs, `sql/` for 50 vendors & DPCO catalog).
- **Output Databases Hub:** `backend/processed_data/` strictly divided into:
  - `sqlite/procurement_cases.db` (6 tables: `vendors`, `vendor_products`, `pricing_references`, `procurement_cases`, `audit_logs`, `vendor_profiles`).
  - `graph/knowledge_graph.graphml` (5,757 nodes mapping Indian regulations and entities) and `knowledge_graph.json`.
  - `qdrant/` (dense 768-dim Nomic vector storage).
- **Build Scripts:** `backend/build/` (`seed_data.py`, `build_all.py`, `build_knowledge_graph.py`, `ingest_rag_docs.py`).

---

## 2. Current Architectural State (What is Fully Completed)
- **LangGraph Multi-Agent Engine:** Fully operational and stateful in [`backend/src/agents/workflow.py`](../backend/src/agents/workflow.py):
  - `planner.py` evaluates deal size in INR (< ₹5,00,000 `LIGHT` vs ≥ ₹5,00,000 `FULL`).
  - `rag_agent.py` coordinates Qdrant vector retrieval and 5,757-node graph traversal with 4-step fusion.
  - `scraper_agent.py` queries SQLite for 50 registered vendors, checks DPCO 2013 ceilings in INR, runs external web searches via `web_scraper.py`, and caches profiles to `vendor_profiles`.
  - `scorer.py` evaluates 4 risk dimensions (Financial, Compliance, Contractual, Pricing in INR) and computes confidence score.
  - `critic.py` audits confidence against 0.80 threshold (up to 3 revision loops).
  - `writer.py` synthesizes the final `ProcurementReport` in INR.
- **Relational CaseStore:** [`backend/src/db/session.py`](../backend/src/db/session.py) manages the 6 relational tables with queries for vendors, products, pricing references, audit logs, and vendor profiles.
- **REST API Endpoints:** [`backend/src/routers/procurement.py`](../backend/src/routers/procurement.py) and [`backend/src/routers/approval.py`](../backend/src/routers/approval.py) expose full case submission, status polling, report fetching, global logs (`/procurement/logs`), case audit trail (`/procurement/{id}/audit`), vendor directory (`/procurement/vendors`), and pricing catalog (`/procurement/pricing-catalog`).

---

## 3. Strict Operational Guidelines for AI Assistants
1. **Currency Mandate:** All financial amounts, deal sizes, and ceiling checks must be strictly denominated in Indian Rupees (**INR / ₹**).
2. **Never Wipe `processed_data/`:** Do NOT run commands with `--force-clean` that wipe `processed_data/`. The 5,757-node knowledge graph and Qdrant collections are pre-computed and must be preserved. Use `python backend/build/seed_data.py` to seed relational tables.
3. **Dedicated Prompts:** Any modifications to LLM behavior should be made directly in [`backend/src/prompts/`](../backend/src/prompts/), preserving Indian statutory references (CDSCO, DPCO 2013, Schedule M, WHO TRS 1025).
4. **Git Branch:** Active development branch is **`kamalesh`**.
