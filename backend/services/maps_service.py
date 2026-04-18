def get_route(from_lat: float, from_lng: float, to_facility_id: str, accessibility_required: bool) -> dict:
    """
    Simulates Google Routes API given the constraints of the venue.
    In real usage, this would call the Google Maps Routes API.
    """
    # Return a simulated polyline and step info
    return {
        "steps": [
            {"instruction": "Walk towards the main concourse.", "distance_m": 50},
            {"instruction": f"Follow signs to {to_facility_id}.", "distance_m": 120}
        ],
        "estimated_minutes": 5,
        "crowd_avoidance_applied": False,
        "polyline": "simulated_polyline_string"
    }

def get_least_crowded_path(from_lat: float, from_lng: float, to_zone: str) -> dict:
    """
    Reroutes if direct path has crowd score > 70.
    """
    # Simulated response
    return {
        "steps": [
            {"instruction": "Take the alternate stairwell to avoid congestion.", "distance_m": 80},
            {"instruction": f"Proceed to {to_zone}.", "distance_m": 100}
        ],
        "estimated_minutes": 8,
        "crowd_avoidance_applied": True,
        "polyline": "simulated_polyline_string_avoidance"
    }
