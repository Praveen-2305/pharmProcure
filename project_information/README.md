# AutonoSource (pharmProcure) — Agent Onboarding & Documentation Index

Welcome to the **AutonoSource Project Information Hub**. This directory is structured to provide any incoming AI agent or engineer with complete, unambiguous context on the platform's purpose, architecture, state machines, algorithms, databases, APIs, workflows, and production data roadmap.

## Reading Order for New Sessions / Incoming Agents

To rapidly gain full competence over this codebase, read the documents in the following sequence:

| Document | Topic & Focus Area |
| :--- | :--- |
| [**`01_PROJECT_OVERVIEW_AND_POC_FOUNDATIONS.md`**](01_PROJECT_OVERVIEW_AND_POC_FOUNDATIONS.md) | Business context, problem statement, pharmaceutical regulatory landscape (CDSCO Drugs & Cosmetics Act 1940, Schedule M GMP, WHO TRS 1025 Cold Chain, NPPA DPCO 2013). |
| [**`02_MULTI_AGENT_WORKFLOW_AND_PROMPTS.md`**](02_MULTI_AGENT_WORKFLOW_AND_PROMPTS.md) | LangGraph `StateGraph`, `WorkflowState`, the 5 agent nodes (Planner, Executor, Scorer, Critic, Writer), routing conditions, revision loop mechanics, and prompt templates. |
| [**`03_HYBRID_RAG_CONTRADICTION_AND_WEB_SCRAPING.md`**](03_HYBRID_RAG_CONTRADICTION_AND_WEB_SCRAPING.md) | Dual-retriever architecture (Qdrant Vector + NetworkX Graph), 4-step fusion, mathematical contradiction resolution, regulated pricing ceiling checks, and live web scraping due diligence. |
| [**`04_DATABASE_ARCHITECTURE_AND_BUILD_SYSTEM.md`**](04_DATABASE_ARCHITECTURE_AND_BUILD_SYSTEM.md) | The 4 database subsystems under `backend/processed_data/` (Relational SQLite, Vector Qdrant, Graph NetworkX, Pricing DPCO) and the master `build_all.py` rebuild engine. |
| [**`05_REST_API_AND_FRONTEND_SPECIFICATION.md`**](05_REST_API_AND_FRONTEND_SPECIFICATION.md) | Complete REST API contract (`/procurement/*`, `/approval/*`), camelCase JSON schemas, React frontend screens, polling lifecycle, and CLI runner commands. |
| [**`06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md`**](06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md) | **Mock to Original Production Data Plan**: Roadmap for migrating SQLite, in-memory Qdrant, and NetworkX to enterprise PostgreSQL, Qdrant Cloud, Neo4j, live NPPA DPCO gazettes, and CLM/ERP integrations. |
| [**`07_LLM_AGENT_HANDOFF_CONTEXT.md`**](07_LLM_AGENT_HANDOFF_CONTEXT.md) | **LLM Handoff Guide**: Strict, un-sugared technical context, path rules, and exact "Next Steps" intended for the next AI agent session to resume development seamlessly. |

---

## 🗄️ Mock vs. Original Production Data Transition Summary

For developers looking to connect enterprise data sources, refer directly to [`06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md`](06_DATA_TRANSITION_PLAN_MOCK_TO_PRODUCTION.md). It outlines:
- **Phase 1 (Weeks 1-3):** Abstracting data layer interfaces and establishing dual-write / shadow schemas.
- **Phase 2 (Weeks 4-6):** Scheduled crawlers for official NPPA gazettes and CDSCO notices + batch Qdrant ingestion.
- **Phase 3 (Weeks 7-9):** Enterprise CLM (Icertis/DocuSign) and MCA21/openFDA live API webhooks.
- **Phase 4 (Weeks 10-12):** Production cutover to PostgreSQL & Neo4j with full GxP 21 CFR Part 11 audit logging.

---

## Quick Reference Commands

```bash
# Clean and rebuild all 4 databases (mock/local environment)
python backend/build/build_all.py

# Run an end-to-end procurement audit via CLI
python backend/scripts/run_agent_pipeline.py --vendor "Apex BioLogistics" --deal 350000

# Run the web scraper due diligence on a vendor
python backend/scripts/scrape_vendor_intel.py --vendor "Global Pharma Logistics"

# Start the FastAPI server
cd backend && uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```
