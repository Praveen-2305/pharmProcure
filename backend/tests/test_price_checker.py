import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_get_price_catalog():
    response = client.get("/tools/price-check/catalog")
    assert response.status_code == 200
    catalog = response.json()
    assert isinstance(catalog, list)
    assert len(catalog) > 0
    assert any("Paracetamol" in item["name"] or "Generic" in item["name"] for item in catalog)


def test_price_check_statutory_violation():
    payload = {
        "drugName": "Paracetamol 650mg",
        "quotedPrice": 3500000.0,
        "quantity": 2,
    }
    response = client.post("/tools/price-check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["isCompliant"] is False
    assert data["verdict"] == "STATUTORY_VIOLATION"
    assert data["totalOverpayment"] > 0
    assert data["quantity"] == 2
    assert "ALERT" in data["verdictMessage"]


def test_price_check_legal():
    payload = {
        "drugName": "Paracetamol 650mg",
        "quotedPrice": 2000000.0,
        "quantity": 1,
    }
    response = client.post("/tools/price-check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["isCompliant"] is True
    assert data["verdict"] == "LEGAL"
    assert data["totalOverpayment"] == 0.0
