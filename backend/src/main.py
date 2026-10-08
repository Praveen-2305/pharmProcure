import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings
from src.routers.procurement import router as procurement_router
from src.routers.approval import router as approval_router
from src.api.price_checker import router as price_checker_router
from src.api.analytics import router as analytics_router

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
app.include_router(price_checker_router)
app.include_router(analytics_router)

# Mount legacy prefix for backward compatibility
app.include_router(procurement_router, prefix="/api")
app.include_router(approval_router, prefix="/api")
app.include_router(price_checker_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")

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
            "/procurement/logs",
            "/procurement/{id}/audit",
            "/procurement/vendors",
            "/procurement/pricing-catalog",
            "/approval/pending",
            "/approval/{id}/decide"
        ],
        "currency": "INR",
        "database": "backend/processed_data/sqlite/procurement_cases.db",
        "agents": ["Planner", "Executor", "RiskScorer", "Critic", "ReportWriter"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
