import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_chat_assistant():
    response = client.post("/api/chat", json={
        "message": "Where is the nearest food?",
        "user_context": {"user_zone": "Z1"},
        "conversation_history": []
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "suggested_actions" in data
    assert "map_highlight" in data
    
def test_emergency_query():
    response = client.post("/api/chat", json={
        "message": "I need a doctor fast",
        "user_context": {},
        "conversation_history": []
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["response"]) > 0
