import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_list_vendor_directory():
    response = client.get("/vendors")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "vendors" in data
    assert data["total"] > 0
    assert data["currency"] == "INR"
    v = data["vendors"][0]
    assert "vendorId" in v
    assert "vendorName" in v
    assert "creditRating" in v
    assert "otifRatePercent" in v
    assert "compositeQualityScore" in v


def test_filter_vendor_directory_by_query():
    response = client.get("/vendors?query=Apex")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("Apex" in v["vendorName"] for v in data["vendors"])


def test_get_vendor_360_profile():
    # Retrieve first vendor ID from list
    list_res = client.get("/vendors")
    vendor_id = list_res.json()["vendors"][0]["vendorId"]

    response = client.get(f"/vendors/{vendor_id}/profile")
    assert response.status_code == 200
    profile = response.json()
    assert profile["vendorId"] == vendor_id
    assert "vendorName" in profile
    assert "pillars" in profile
    assert "financialScore" in profile["pillars"]
    assert "riskTrend" in profile
    assert len(profile["riskTrend"]) >= 3
    assert "products" in profile
    assert "linkedCases" in profile
