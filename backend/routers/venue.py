from fastapi import APIRouter
from services.firestore_service import firestore_service
from services.crowd_engine import calculate_crowd_score

router = APIRouter()

@router.get("/venue/status")
async def get_venue_status():
    status = firestore_service.get_venue_status()
    
    # Enrich with crowd calculations
    if "zones" in status:
        for zone in status["zones"]:
            score = calculate_crowd_score(zone["id"], zone["current_occupancy"], zone["capacity"], "active")
            zone["crowd_score"] = score
            
    return status
