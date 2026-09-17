# AutonoSource (pharmProcure) — Collaborative Feature Integration Roadmap

**Document Version:** 1.0.0  
**Branch:** `backend-integration`  
**Collaborators:** Kamalesh (RAG & Knowledge Graph Architect) & Praveen (Backend & Fullstack Lead)  
**Tracking System:** Markdown Interactive Checklist & Task Ledger  

---

## 📊 High-Level Collaboration Progress

| Feature Area | Owner | Status | Progress |
| :--- | :--- | :--- | :--- |
| **1. RAG & Knowledge Graph Engine** | Kamalesh | `COMPLETED` | 100% (5,757-Node KG, Qdrant vectors, 4-step fusion) |
| **2. Relational DB & 50-Vendor Directory** | Kamalesh | `COMPLETED` | 100% (6 SQLite tables, DPCO 2013 catalog in INR) |
| **3. LangGraph Multi-Agent Architecture** | Kamalesh | `COMPLETED` | 100% (StateGraph with Planner, Scorer, Critic, Writer) |
| **4. Backend Boot & Environment Setup** | Praveen | `IN PROGRESS` | 40% (venv_gpu identified, boot error diagnosed) |
| **5. Live Stage Streaming for Polling** | Praveen | `TODO` | 0% (Convert invoke to stream in background runner) |
| **6. Contract Document PDF Extraction** | Praveen | `TODO` | 0% (Save UploadFile and extract clauses with PyMuPDF) |
| **7. Human Approval Governance Loop** | Praveen | `TODO` | 50% (Endpoint ready, needs revision loop test) |
| **8. End-to-End Frontend Integration** | Praveen | `TODO` | 20% (Frontend ready, waiting for backend live run) |

---

## 🛠️ Detailed Feature-by-Feature Task List

### Feature 1: Backend Boot Stabilization & Environment Config
> **Goal:** Ensure the backend starts with `D:\venv_gpu\python.exe app.py` without import errors or API key crashes.

- [x] **[Kamalesh]** Core FastAPI server setup and routing structure ([`backend/src/main.py`](../backend/src/main.py)).
- [x] **[Praveen]** Identify Python runtime path (`D:\venv_gpu\python.exe`) and verify installed packages (`fastapi`, `langgraph`, `pydantic`, `networkx`).
- [ ] **[Praveen]** Fix `OpenAIError` in [`backend/src/agents/web_scraper.py`](../backend/src/agents/web_scraper.py):
  - Change `self.llm = ChatOpenAI(...)` to lazy initialization so it only instantiates when `GROQ_API_KEY` or `OPENAI_API_KEY` is present.
  - Provide immediate rule-based regex fallback when keys are absent.
- [ ] **[Praveen]** Create [`backend/.env.example`](../backend/.env.example) and [`backend/.env`](../backend/.env) with local defaults.
- [ ] **[Praveen]** Verify clean boot test:
  ```powershell
  D:\venv_gpu\python.exe -c "from src.main import app; print('FastAPI App Started Successfully')"
  ```

---

### Feature 2: RAG & Knowledge Retrieval Verification
> **Goal:** Verify that both Vector RAG and 5,757-Node Graph RAG run fast and reliably during agent execution.

- [x] **[Kamalesh]** Generate 5,757-node Knowledge Graph ([`knowledge_graph.graphml`](../backend/processed_data/graph/knowledge_graph.graphml)).
- [x] **[Kamalesh]** Build 4-step contradiction resolution engine ([`backend/src/rag_pipeline/fusion.py`](../backend/src/rag_pipeline/fusion.py)).
- [ ] **[Praveen]** In-Memory Graph Caching:
  - Cache the loaded `nx.read_graphml()` graph in [`backend/src/rag_pipeline/graph_store.py`](../backend/src/rag_pipeline/graph_store.py) so repeated queries take < 5ms.
- [ ] **[Praveen]** Vector Store Fallback Hardening:
  - Verify that [`backend/src/rag_pipeline/vector_store.py`](../backend/src/rag_pipeline/vector_store.py) gracefully returns domain benchmark facts in INR if `qdrant-client` is not installed in the environment.
- [ ] **[Praveen]** Run RAG retrieval diagnostic:
  ```powershell
  D:\venv_gpu\python.exe -c "from src.rag_pipeline.graph_store import GraphRAGRetriever; g = GraphRAGRetriever(); print('Graph Facts:', len(g.query('DPCO', max_depth=1)))"
  ```

---

### Feature 3: Real-Time Multi-Agent Stage Streaming
> **Goal:** Connect the 1.5s frontend polling loop (`GET /procurement/{id}/status`) to live agent execution so the UI shows each stage transitioning smoothly.

- [x] **[Kamalesh]** LangGraph StateGraph compiled with Planner, RAG, Scraper, Scorer, Critic, and Writer nodes ([`workflow.py`](../backend/src/agents/workflow.py)).
- [ ] **[Praveen]** Update `_run_workflow_sync` in [`backend/src/routers/procurement.py`](../backend/src/routers/procurement.py):
  - Replace `result = workflow_engine.invoke(initial_state)` with an event streaming loop:
    ```python
    for event in workflow_engine.stream(initial_state):
        for node_name, node_state in event.items():
            active_workflows[procurement_id].update(node_state)
            # Update stage in case_store for polling
            case = case_store.get(procurement_id)
            if case and "stage" in node_state:
                case.status.stage = node_state["stage"]
                case_store.save(case)
    ```
- [ ] **[Praveen]** Verify live progress through frontend status polling:
  - `PLANNING` ➔ `EXECUTING` ➔ `SCORING` ➔ `CRITIQUING` ➔ `WRITING_REPORT` ➔ `AWAITING_APPROVAL`.

---

### Feature 4: Contract Document Upload & Parsing
> **Goal:** Allow users to upload MSA / procurement contracts (PDF) on the frontend and extract clauses for compliance audit.

- [x] **[Kamalesh]** Add `contractDocument: UploadFile` parameter to `POST /procurement/submit`.
- [ ] **[Praveen]** Save uploaded PDF file to `backend/processed_data/uploads/{procurement_id}/`.
- [ ] **[Praveen]** Extract text clauses using `pymupdf` (fitz) or text buffer and attach extracted clauses into `WorkflowState["evidence_bundle"]["contract_clauses"]`.
- [ ] **[Praveen]** Feed extracted clauses to Risk Scorer for liability cap and cold-chain compliance verification.

---

### Feature 5: Human-in-the-Loop Governance & Revision Loop
> **Goal:** Complete the approval workflow where officers can approve, reject, or request more information with full audit trail logging.

- [x] **[Kamalesh]** Approval router endpoints `GET /approval/pending` and `POST /approval/{id}/decide` ([`backend/src/routers/approval.py`](../backend/src/routers/approval.py)).
- [x] **[Kamalesh]** Mandatory justification reason validation for `REJECT` and `REQUEST_MORE_INFO`.
- [ ] **[Praveen]** Verify `REQUEST_MORE_INFO` loop:
  - When an officer requests more info, ensure `revision_count` is incremented and state loops back to `EXECUTING`.
- [ ] **[Praveen]** Verify timeline audit trail in `GET /procurement/{id}/audit`.

---

### Feature 6: Full Live Frontend-Backend Integration Test
> **Goal:** Run both servers simultaneously and complete a real procurement audit from the web interface.

- [ ] **[Praveen]** Ensure `frontend/.env` has `VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL=http://localhost:8000`.
- [ ] **[Praveen]** Start backend server on port 8000:
  ```powershell
  cd backend
  D:\venv_gpu\python.exe -m uvicorn src.main:app --port 8000 --reload
  ```
- [ ] **[Praveen]** Start frontend dev server on port 5173:
  ```powershell
  cd frontend
  npm run dev
  ```
- [ ] **[Pair]** Test complete flow:
  1. Open `http://localhost:5173/submit`
  2. Submit vendor: `"Apex BioLogistics Pvt. Ltd."`, Deal Size: `₹35,00,000`, Category: `Cold-Chain Biologics`
  3. Observe live stage transitions on the Vendor Review screen
  4. View generated `ProcurementReport` with 4D risk scores, contradiction resolution, and NPPA DPCO price ceiling check
  5. Go to `/approvals` and record an `APPROVE` decision
  6. Confirm case updates to `COMPLETE` on Dashboard!

---

## 📝 Collaborative Work Log

| Date | Collaborator | Action / Feature Completed | Files Touched |
| :--- | :--- | :--- | :--- |
| **2026-09-13** | Kamalesh | Built 5,757-node Knowledge Graph & Qdrant vector store | `backend/processed_data/*` |
| **2026-09-13** | Kamalesh | Implemented 4-step RAG fusion with contradiction resolution | `backend/src/rag_pipeline/fusion.py` |
| **2026-09-13** | Kamalesh | Seeded SQLite 50-vendor directory & DPCO pricing catalog | `backend/processed_data/sqlite/*` |
| **2026-09-16** | Praveen | Created dedicated `backend-integration` branch off `kamalesh` | Git branch `backend-integration` |
| **2026-09-16** | Praveen | Diagnosed Python runtime (`D:\venv_gpu\python.exe`) and boot blocker | `backend/src/agents/web_scraper.py` |
| **2026-09-16** | Praveen | Created collaborative feature roadmap and checklist | `project_information/08_COLLABORATIVE_FEATURE_ROADMAP.md` |
