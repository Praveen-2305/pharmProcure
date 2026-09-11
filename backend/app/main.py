"""
Main FastAPI Application Entry Point for AutonoSource (pharmProcure).
Mounts /procurement and /approval routers matching the frontend contract.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers.procurement import router as procurement_router
from app.routers.approval import router as approval_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-agent procurement audit engine with Hybrid RAG & Contradiction Resolution"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount primary routers matching frontend contract
app.include_router(procurement_router)
app.include_router(approval_router)

# Mount legacy prefix for backward compatibility
app.include_router(procurement_router, prefix="/api")
app.include_router(approval_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "endpoints": [
            "/procurement/submit",
            "/procurement/{id}/status",
            "/procurement/{id}/report",
            "/procurement/all",
            "/approval/pending",
            "/approval/{id}/decide"
        ],
        "agents": ["Planner", "Executor", "RiskScorer", "Critic", "ReportWriter"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
