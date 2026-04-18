from fastapi import APIRouter
from models.chat import ChatRequest, ChatResponse
from services.gemini_service import chat
from services.firestore_service import firestore_service

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    # Inject live venue data into context
    venue_context = firestore_service.get_venue_status()
    
    # Merge user context with venue context
    full_context = {
        "user": request.user_context,
        "venue": venue_context
    }
    
    # Call Gemini service
    result = await chat(request.message, full_context, [msg.model_dump() for msg in request.conversation_history])
    
    return ChatResponse(**result)
