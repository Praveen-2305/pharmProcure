## APPENDICES

Appendix A — Seed Data and Test Cases
- Location: `backend/ingestion/sql` and `backend/processed_data/sqlite`
- Contents: 50 vendor records, DPCO pricing catalog, canonical case examples used
  for evaluation.

Appendix B — Build & Seed Commands
- `python backend/build/seed_data.py` — populate SQLite with vendors and pricing.
- `python backend/build/ingest_rag_docs.py` — ingest regulatory documents into Qdrant.

Appendix C — Notable Implementation Files
- `backend/src/agents/planner.py`
- `backend/src/agents/rag_agent.py`
- `backend/src/agents/scraper_agent.py`
- `backend/src/agents/scorer.py`
- `backend/src/agents/critic.py`
- `backend/src/agents/writer.py`

Appendix D — Glossary
- RAG: Retrieval-Augmented Generation
- Qdrant: Dense vector database used for semantic retrieval
- KG: Knowledge Graph (NetworkX)
- DPCO: Drugs (Prices Control) Order, 2013
