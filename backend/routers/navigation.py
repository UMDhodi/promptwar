from fastapi import APIRouter
from models.chat import NavigationRequest
from services.maps_service import get_route, get_least_crowded_path
from services.firestore_service import firestore_service

router = APIRouter()

@router.post("/route")
async def get_navigation_route(req: NavigationRequest):
    # Simulated check crowd score of target facility's zone.
    # In real app, we would query the specific zone score from firestore_service.
    status = firestore_service.get_venue_status()
    
    # Check zone (stubbed for mock)
    # Target score = 50
    target_crowd_score_mock = 50
    
    if target_crowd_score_mock > 70:
        return get_least_crowded_path(req.from_lat, req.from_lng, req.to_facility_id)
    
    return get_route(req.from_lat, req.from_lng, req.to_facility_id, req.accessibility_required)
