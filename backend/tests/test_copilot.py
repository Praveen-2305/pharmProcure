import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_copilot_suggested_questions():
    response = client.get("/copilot/suggested-questions?route=/price-check")
    assert response.status_code == 200
    questions = response.json()
    assert isinstance(questions, list)
    assert len(questions) > 0
    assert any("DPCO" in q or "NPPA" in q for q in questions)


def test_copilot_grounded_ask():
    payload = {
        "query": "What are the cold chain temperature requirements under WHO TRS 1025?",
        "currentRoute": "/review/PR-2026-8801-BIO",
    }
    response = client.post("/copilot/ask", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["isGrounded"] is True
    assert "2°C–8°C" in data["answer"] or "data loggers" in data["answer"]
    assert len(data["citations"]) > 0
    assert any("WHO" in c["title"] or "Storage" in c["source"] for c in data["citations"])


def test_copilot_refusal_ungrounded():
    payload = {
        "query": "What is the best movie of 1999 according to film critics?",
    }
    response = client.post("/copilot/ask", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Must refuse to hallucinate non-domain queries
    assert data["isGrounded"] is False
    assert "AutonoSource Procurement Copilot" in data["answer"]
    assert len(data["citations"]) == 0
