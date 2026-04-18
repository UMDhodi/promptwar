def calculate_crowd_score(zone_id: str, occupancy: int, capacity: int, time_of_event: str) -> dict:
    """
    Calculates the crowd score for a given zone.
    
    Logic:
    - Base score = occupancy / capacity * 100
    - Time multiplier: halftime or end-of-event increases movement score (simulated)
    """
    if capacity <= 0:
        return {"density_percent": 0, "movement_risk": 0, "recommendation": "Avoid"}
        
    density_percent = (occupancy / capacity) * 100
    
    movement_risk = 1.0
    if time_of_event in ["halftime", "end"]:
        movement_risk = 1.5
        
    effective_score = density_percent * movement_risk
    
    recommendation = "Clear"
    if effective_score > 80:
        recommendation = "Highly Congested - Alternate Route Advised"
    elif effective_score > 60:
        recommendation = "Moderate Congestion"
        
    return {
        "zone_id": zone_id,
        "density_percent": min(100.0, round(density_percent, 2)),
        "movement_risk": movement_risk,
        "recommendation": recommendation,
        "effective_score": effective_score
    }

def simulate_crowd_changes(occupancy: int, capacity: int) -> int:
    """
    Simulates variations in crowd levels to emulate a background Cloud Run job.
    """
    import random
    # Adjust occupancy by -5% to +5%
    variation = capacity * random.uniform(-0.05, 0.05)
    new_occupancy = max(0, min(capacity, int(occupancy + variation)))
    return new_occupancy
