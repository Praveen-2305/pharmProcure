import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_simulate_price_concession_brings_within_dpco():
    payload = {
        "quotedPrice": 23500000.0,  # Below ceiling of 24,900,000
        "coldChainSla": "WHO TRS 1025 (2°C–8°C Loggers)",
        "liabilityCapPercent": 150.0,
        "otifRatePercent": 98.5,
        "curePeriodDays": 30,
        "creditScore": 780
    }
    response = client.post("/procurement/test-case-123/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["procurementId"] == "test-case-123"
    assert data["isDpcoCompliantAfter"] is True
    assert data["simulatedOverallRisk"] == "LOW"
    assert data["riskScoreDelta"] < 0  # Risk decreased!
    assert any("Pricing Compliance" in d["dimension"] for d in data["dimensions"])


def test_simulate_price_hike_exceeds_dpco():
    payload = {
        "quotedPrice": 32000000.0,  # Far above ceiling of 24,900,000
        "coldChainSla": "Ambient 15°C–25°C",
        "liabilityCapPercent": 20.0
    }
    response = client.post("/procurement/test-case-456/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["isDpcoCompliantAfter"] is False
    assert data["simulatedOverallRisk"] == "HIGH"
    assert data["priceVariancePercentAfter"] > 0
