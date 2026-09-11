"""
Main FastAPI Application Entry Point for AutonoSource (pharmProcure).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.procurement import router as procurement_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-agent procurement audit engine with Qdrant Vector RAG + NetworkX Graph RAG & Contradiction Resolution"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(procurement_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "vector_store": "Qdrant",
        "graph_store": "NetworkX Property Graph",
        "agents": ["Planner", "Executor", "RiskScorer", "Critic", "ReportWriter"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
