"""
Top-level entry point alias for uvicorn and app invocation.
Forwards to app.main:app.
"""

from src.main import app

if __name__ == "__main__":
    import os
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("src.main:app", host=host, port=port, reload=False)
