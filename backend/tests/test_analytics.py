import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_get_impact_analytics():
    response = client.get("/analytics/impact")
    assert response.status_code == 200
    data = response.json()

    # Verify core business metrics exist and are positive
    assert "totalCasesProcessed" in data
    assert data["totalCasesProcessed"] > 0

    assert "totalOverpaymentBlockedInr" in data
    assert data["totalOverpaymentBlockedInr"] >= 0

    assert "analystHoursSaved" in data
    assert data["analystHoursSaved"] > 0

    assert "roiMultiple" in data
    assert data["roiMultiple"] > 0

    # Verify sub-objects
    assert "riskDistribution" in data
    assert "low" in data["riskDistribution"]
    assert "medium" in data["riskDistribution"]
    assert "high" in data["riskDistribution"]

    assert "savingsOverTime" in data
    assert isinstance(data["savingsOverTime"], list)

    assert "topExposedVendors" in data
    assert isinstance(data["topExposedVendors"], list)

    assert "assumptions" in data
    assert data["assumptions"]["analystHourlyRateInr"] == 1500.0
