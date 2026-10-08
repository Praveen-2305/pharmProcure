import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_list_alerts():
    response = client.get("/alerts")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "unacknowledgedCount" in data
    assert "alerts" in data
    assert data["total"] >= 3
    a = data["alerts"][0]
    assert "alertId" in a
    assert "alertType" in a
    assert "vendorName" in a
    assert "statuteReference" in a
    assert "suggestedRemedy" in a


def test_acknowledge_alert():
    list_res = client.get("/alerts?unacknowledged_only=true")
    assert list_res.status_code == 200
    unack_alerts = list_res.json()["alerts"]
    if unack_alerts:
        target_id = unack_alerts[0]["alertId"]
        ack_res = client.post(f"/alerts/{target_id}/ack")
        assert ack_res.status_code == 200
        assert ack_res.json()["isAcknowledged"] is True


def test_simulate_regulatory_event():
    payload = {
        "alertType": "CDSCO_NSQ_ALERT",
        "vendorName": "Apex BioLogistics Pvt. Ltd.",
        "severity": "CRITICAL",
        "headline": "CDSCO Issues Show-Cause Notice for Impurity Spike",
        "description": "Critical show-cause notice issued regarding Nitrosamine impurity exceeding 0.03 ppm limit.",
        "statuteReference": "Drugs and Cosmetics Act, 1940 Section 27",
        "suggestedRemedy": "Initiate emergency recall and pause vendor purchase orders.",
        "vendorId": "VND-001"
    }
    response = client.post("/admin/simulate-event", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "alertId" in data
    assert data["severity"] == "CRITICAL"
    assert data["vendorName"] == "Apex BioLogistics Pvt. Ltd."
    assert data["isAcknowledged"] is False
