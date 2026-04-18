from pydantic import BaseModel, Field
from typing import List, Optional

class NavigationRequest(BaseModel):
    """Request model for smart navigation."""
    from_lat: float
    from_lng: float
    to_facility_id: str
    accessibility_required: bool = False

class AlertData(BaseModel):
    """Pydantic model for alerts"""
    type: str
    message: str
    timestamp: int

class ChatMessage(BaseModel):
    """Represents a single chat message in the conversation history."""
    role: str
    content: str
    
class Action(BaseModel):
    """Suggested action derived from Gemini response."""
    label: str
    query: str

class ChatRequest(BaseModel):
    """Request model for the Gemini assistant endpoint."""
    message: str
    user_context: dict = Field(default_factory=dict)
    conversation_history: List[ChatMessage] = Field(default_factory=list)

class ChatResponse(BaseModel):
    """Response model from the Gemini assistant endpoint."""
    response: str
    suggested_actions: List[Action] = Field(default_factory=list)
    map_highlight: Optional[str] = None
