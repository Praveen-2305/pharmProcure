import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_compare_vendors_success():
    payload = {
        "vendorNames": ["Apex BioLogistics Pvt. Ltd.", "Bharat Parenterals Corp."],
        "drugName": "Biopharmaceutical Cold-Chain Monoclonal Antibodies",
        "quantity": 2,
        "priceWeight": 0.40,
        "complianceWeight": 0.30,
        "resilienceWeight": 0.15,
        "governanceWeight": 0.15,
    }
    response = client.post("/procurement/compare", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["drugName"] == "Biopharmaceutical Cold-Chain Monoclonal Antibodies"
    assert len(data["candidates"]) == 2
    assert "recommendation" in data
    assert "recommendedVendor" in data["recommendation"]
    assert len(data["recommendation"]["whyNotOthers"]) == 1

    # Verify candidate properties
    first_candidate = data["candidates"][0]
    assert "compositeRankScore" in first_candidate
    assert "pillars" in first_candidate
    assert "totalCostOfOwnershipInr" in first_candidate
    assert first_candidate["compositeRankScore"] >= data["candidates"][1]["compositeRankScore"]


def test_compare_vendors_min_length_validation():
    payload = {
        "vendorNames": ["Solo Vendor"],
        "drugName": "Paracetamol",
    }
    response = client.post("/procurement/compare", json=payload)
    assert response.status_code == 422 or response.status_code == 400
