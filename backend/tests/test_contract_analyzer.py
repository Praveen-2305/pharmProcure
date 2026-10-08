import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_contract_audit_default_sample():
    response = client.post("/tools/contract-analyzer/audit")
    assert response.status_code == 200
    data = response.json()
    assert "documentName" in data
    assert "overallContractRisk" in data
    assert "totalClausesAnalyzed" in data
    assert len(data["clauses"]) > 0
    # Sample has liability cap and foreign jurisdiction, so should be HIGH or MEDIUM risk
    assert data["overallContractRisk"] in ["MEDIUM", "HIGH"]
    clause_titles = [c["clauseTitle"] for c in data["clauses"]]
    assert any("Liability" in t or "Jurisdiction" in t or "Storage" in t for t in clause_titles)


def test_contract_audit_custom_text():
    custom_contract = (
        "Clause 1: Storage conditions: 2°C to 8°C cold chain verified with continuous IoT loggers.\n"
        "Clause 2: Liability: Supplier indemnifies buyer with 200% contract value for product recalls.\n"
        "Clause 3: Dispute Resolution: Arbitration Act 1996 in New Delhi, India."
    )
    response = client.post(
        "/tools/contract-analyzer/audit",
        data={"contract_text": custom_contract, "document_name": "compliant_agreement.txt"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["documentName"] == "compliant_agreement.txt"
    assert data["totalClausesAnalyzed"] >= 3
    assert data["violationsCount"] == 0


def test_negotiation_pack_generation():
    payload = {
        "vendorName": "Apex Life Sciences Ltd",
        "contractTitle": "Master Supply Contract 2026",
        "flaggedClauses": ["Liability", "Cold Chain Storage", "Jurisdiction"]
    }
    response = client.post("/tools/contract-analyzer/negotiation-pack", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["vendorName"] == "Apex Life Sciences Ltd"
    assert "emailSubject" in data
    assert "emailBodyDraft" in data
    assert len(data["replacementClauses"]) >= 2
    assert len(data["negotiationStrategyTips"]) >= 2
