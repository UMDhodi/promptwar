import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_navigation_route_standard():
    response = client.post("/api/route", json={
        "from_lat": 28.6139,
        "from_lng": 77.2090,
        "to_facility_id": "C1",
        "accessibility_required": False
    })
    assert response.status_code == 200
    data = response.json()
    assert "steps" in data
    assert "polyline" in data
    
def test_navigation_route_accessible():
    response = client.post("/api/route", json={
        "from_lat": 28.6139,
        "from_lng": 77.2090,
        "to_facility_id": "C1",
        "accessibility_required": True
    })
    assert response.status_code == 200
    data = response.json()
    assert "steps" in data
    assert "polyline" in data
