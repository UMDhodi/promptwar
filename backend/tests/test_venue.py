import pytest
from fastapi.testclient import TestClient
from main import app
from services.crowd_engine import calculate_crowd_score

client = TestClient(app)

def test_get_venue_status():
    response = client.get("/api/venue/status")
    assert response.status_code == 200
    data = response.json()
    # Check that it returns zones if seed data is loaded
    if "zones" in data:
        assert len(data["zones"]) > 0
        assert "crowd_score" in data["zones"][0]

def test_crowd_score_calculation_full():
    score = calculate_crowd_score("Z1", 1000, 1000, "active")
    assert score["density_percent"] == 100
    assert score["recommendation"] == "Highly Congested - Alternate Route Advised"

def test_crowd_score_calculation_empty():
    score = calculate_crowd_score("Z1", 0, 1000, "active")
    assert score["density_percent"] == 0
    assert score["recommendation"] == "Clear"
