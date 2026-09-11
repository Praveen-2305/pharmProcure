# Project Summary: AutonoSource Procurement Agent (pharmProcure)

This document summarizes the overall state, architecture, and completed implementation of the `pharmProcure` project.

---

## 1. Overall Concept

The project is an **AI-Assisted Pharmaceutical Procurement & Risk Intelligence Platform**. It is designed to evaluate vendor risks across 4 dimensions (Financial, Compliance, Contractual, Pricing), cross-check regulatory constraints, detect contract contradictions using Hybrid Vector + Graph RAG, and manage human-in-the-loop procurement approvals via a modern executive dashboard.

---

## 2. Directory Structure Overview

- **`backend/`**: Fully built, enterprise-structured FastAPI and LangGraph multi-agent engine.
  - **`backend/app/`**: FastAPI application entry point, settings configuration, and REST API routes (`/api/procurement/...`).
  - **`backend/agents/`**: 5 specialized AI agent nodes (Planner, Executor, Risk Scorer, Critic, Report Writer).
  - **`backend/rag/`**: Hybrid RAG system featuring Qdrant Vector database retriever and NetworkX property graph store.
  - **`backend/workflow/`**: LangGraph StateGraph engine, 4-step Hybrid RAG Fusion & Contradiction Resolution engine, and Pydantic schemas.
- **`frontend/`**: Complete modern React application built with Vite, Tailwind CSS, Lucide icons, and Framer Motion transitions.
- **`project_information/`**: Contains architectural documentation, handover guides (`backend_architecture_handover.md`), and original POC specifications (`AutonoSource_POC.md`).

---

## 3. Architecture & Implementation Summary

### Frontend Stack (`frontend/`)
* **Framework:** React 18 with TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS & Glassmorphism design tokens
* **Routing:** React Router DOM (`/`, `/dashboard`, `/submit`, `/review/:id`, `/approval`)
* **Key Components:** `ConfidenceBadge.tsx`, `ContradictionFlag.tsx`, `RiskLevelTag.tsx`

### Backend Multi-Agent Stack (`backend/`)
* **Orchestration:** LangGraph (StateGraph pipeline with feedback loops)
* **API Framework:** FastAPI & Uvicorn (`app/main.py`)
* **Vector Database:** Qdrant (`qdrant-client` with `:memory:` & host modes)
* **Graph Store:** NetworkX (`MultiDiGraph` property graph for entity traversal)
* **Hybrid RAG Fusion:** 4-step score normalization, source weighting, contradiction detection, and confidence calculation engine
* **Risk Dimensions:** Financial Risk, Compliance Risk, Contractual Risk, and Pricing Risk (against regulated ceiling prices like NPPA/DPCO)

---

## 4. Operational Handover Documentation

For deep technical details, module responsibility matrices, and API specifications, refer to:
- [`backend_architecture_handover.md`](./backend_architecture_handover.md)
- [`AutonoSource_POC.md`](./AutonoSource_POC.md)
