"""
Core configuration settings for AutonoSource backend.
"""

import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "AutonoSource — Multi-Agent Procurement Agent"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", ":memory:")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")

settings = Settings()
