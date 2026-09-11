# LLM Agent Handoff & Technical Continuation Guide

**ATTENTION LLM AGENT:** If you are reading this document at the start of a new session, this is your strictly technical, un-sugared ground truth regarding the current state of the repository. Do not hallucinate paths or architectures. Rely strictly on the structures detailed below.

## 1. Directory Structure Rule
- **Source Code:** `backend/src/` (Do NOT use `backend/app/`).
- **Data Inputs for Build:** `backend/ingestion/`
- **Mock Data Hub:** `backend/mockdata/`
- **Output Databases:** `backend/processed_data/` (This contains the generated SQLite ledger, Vector JSON, and GraphML files).

## 2. Current Architectural State (What is Done)
- **Database Build System (`build_all.py`):** Fully functional and idempotent. It correctly purges `processed_data/`, builds the Qdrant HNSW vector store, builds the NetworkX graph, copies the NPPA pricing JSON, and seeds the SQLite ledger (`procurement_cases.db`).
- **Environment & Dependencies:** `requirements.txt` is updated with `sentence-transformers`, `einops`, `langgraph`, and `langchain`. The virtual environment is assumed to be active.
- **Pydantic Schemas:** `src/models/schemas.py` is fully implemented and mapped perfectly to the frontend TypeScript interfaces (using `CamelBaseModel` for automatic serialization).
- **Mock Data:** Valid, context-aware mock SLAs with built-in contradictions (e.g. WHO TRS cold-chain 2C-8C vs ambient 15C-25C) are stored in `backend/mockdata/rag_and_graph/`.

## 3. Pending Implementation (What the NEXT Agent Must Do)
The immediate next step in development is the **LangGraph LLM Agent Implementation**. 

### 3.1 LangGraph Nodes (`src/agents/`)
Currently, the agents (`planner.py`, `executor.py`, `scorer.py`, `critic.py`, `writer.py`, `workflow.py`) are likely deterministic stubs. Your goal is to integrate real LLM calls using `langchain-google-genai` (or whichever LLM provider the user configures).
- **Executor:** Must trigger the hybrid RAG (Vector + Graph) and the Tavily Web Scraper.
- **Critic:** Must resolve the mathematical contradictions flagged by the RAG Fusion engine (`src/rag_pipeline/fusion.py`).
- **Writer:** Must output strict JSON matching `ProcurementReport` from `schemas.py`.

### 3.2 Frontend Integration
Once the Python LangGraph agents are hooked up to real LLMs:
- Start the FastAPI server (`uvicorn src.main:app`).
- The frontend (`frontend/src/api/api.ts`) expects REST endpoints at `/procurement/submit` and `/approval/pending`. 
- Verify the frontend UI correctly displays the LLM-generated reports in the approval dashboard.

## 4. Strict Instructions for AI Assistants
1. **Never use dummy values:** If asked to generate mock data, make it highly contextual to pharmaceutical regulations (CDSCO, WHO TRS 1025, Schedule M, NPPA DPCO). 
2. **Path Adherence:** Always run build scripts from `backend/build/`. Always point data paths to `backend/processed_data/`.
3. **No destructive commands:** When building or running, do not delete `mockdata/` or `ingestion/`. Only `build_all.py` is allowed to wipe `processed_data/`.
4. **Idempotency:** Ensure any agent code you write is stateless and repeatable. State must be preserved strictly in `src/agents/state.py`.
