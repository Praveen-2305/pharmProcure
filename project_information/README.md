# AutonoSource (pharmProcure) — Agent Onboarding & Documentation Index

Welcome to the **AutonoSource Project Information Hub**. This directory provides any incoming AI agent or engineer with complete, unambiguous context on the platform's purpose, architecture, state machines, algorithms, databases, APIs, workflows, and production data roadmap.

---

## Reading Order for New Sessions / Incoming Agents

To rapidly gain full competence over this codebase, read the documents in the following sequence:

| Document | Topic & Focus Area |
| :--- | :--- |
| [**`01_PROJECT_OVERVIEW_AND_POC_FOUNDATIONS.md`**](01_PROJECT_OVERVIEW_AND_POC_FOUNDATIONS.md) | Business context, problem statement, Indian pharmaceutical regulatory landscape (CDSCO Drugs & Cosmetics Act 1940, Schedule M GMP, WHO TRS 1025 Cold Chain, NPPA DPCO 2013). |
| [**`02_MULTI_AGENT_WORKFLOW_AND_PROMPTS.md`**](02_MULTI_AGENT_WORKFLOW_AND_PROMPTS.md) | LangGraph `StateGraph`, `WorkflowState`, the specialized agent nodes (Planner, RAG Agent, Scraper Agent, Scorer, Critic, Writer), parallel fan-out routing, revision loops, and dedicated prompt modules in [`backend/src/prompts/`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/src/prompts/). |
| [**`03_HYBRID_RAG_CONTRADICTION_AND_WEB_SCRAPING.md`**](03_HYBRID_RAG_CONTRADICTION_AND_WEB_SCRAPING.md) | Dual-retriever architecture (Qdrant Vector + 5,757-Node NetworkX Graph), 4-step fusion algorithm, mathematical contradiction resolution, statutory DPCO 2013 ceiling checks in INR, and web scraper due diligence with SQLite caching. |
| [**`04_DATABASE_ARCHITECTURE_AND_BUILD_SYSTEM.md`**](04_DATABASE_ARCHITECTURE_AND_BUILD_SYSTEM.md) | The organized storage hub under `backend/processed_data/` (`sqlite/`, `graph/`, `qdrant/`), the 6-table relational schema (50 vendors directory, pricing references, audit logs), and the master build engine. |
| [**`05_REST_API_AND_FRONTEND_SPECIFICATION.md`**](05_REST_API_AND_FRONTEND_SPECIFICATION.md) | Complete REST API contract (`/procurement/*`, `/approval/*`), camelCase JSON schemas, audit logs, vendor directory endpoints, React frontend screens, and CLI runner commands. |
| [**`06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md`**](06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md) | **Mock to Original Production Data Plan**: Migration roadmap for PostgreSQL 16+, Qdrant Cloud, Neo4j, live NPPA DPCO gazettes, and enterprise CLM/ERP integrations. |
| [**`07_LLM_AGENT_HANDOFF_CONTEXT.md`**](07_LLM_AGENT_HANDOFF_CONTEXT.md) | **LLM Handoff Guide**: Strict technical constraints, path rules, and exact "Next Steps" intended for incoming AI agent sessions to resume development seamlessly. |

---

## 🗄️ Database Subsystems & Processed Data Hub

All generated database assets reside strictly under `backend/processed_data/`:
1. **`sqlite/procurement_cases.db`**: Relational store containing `vendors` (50 registered Indian suppliers), `vendor_products` (100+ SKUs), `pricing_references` (DPCO 2013 ceiling prices in INR), `procurement_cases`, `audit_logs`, and `vendor_profiles`.
2. **`graph/knowledge_graph.graphml`**: 5,757-node multi-entity property graph mapping pharmaceutical regulations, obligations, licenses, and dependencies.
3. **`qdrant/`**: Local dense vector collection (768-dim Nomic embeddings) indexing verified regulatory acts and contract clauses.

---

## Quick Reference Commands

```bash
# Seed the 50 vendors directory and DPCO 2013 price ceiling catalog into SQLite:
python backend/build/seed_data.py

# Run an end-to-end procurement audit via CLI with deal amount in INR:
python backend/scripts/run_agent_pipeline.py --vendor "Apex BioLogistics" --deal 350000

# Run the regulatory due diligence web scraper on a vendor:
python backend/scripts/scrape_vendor_intel.py --vendor "Global Pharma Logistics"

# Start the FastAPI backend server:
cd backend && uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

# Start the React frontend dev server:
cd frontend && pnpm run dev
```
