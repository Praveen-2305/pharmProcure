import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_download_dossier_pdf():
    response = client.get("/procurement/test-dossier-01/dossier.pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment; filename=" in response.headers["content-disposition"]
    # Verify PDF magic bytes %PDF-
    assert response.content.startswith(b"%PDF-")
    assert len(response.content) > 1000
