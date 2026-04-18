from fastapi import APIRouter
from services.firestore_service import firestore_service

router = APIRouter()

@router.get("/alerts")
async def get_active_alerts():
    return firestore_service.get_alerts()
