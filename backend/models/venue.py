from pydantic import BaseModel
from typing import List, Optional

class Zone(BaseModel):
    id: str
    name: str
    capacity: int
    current_occupancy: int

class Facility(BaseModel):
    id: str
    name: Optional[str] = None
    lat: float
    lng: float

class Gate(Facility):
    type: str

class Concession(Facility):
    zone: str
    wait_minutes: int

class Restroom(Facility):
    zone: str
    wait_minutes: int
    accessible: bool

class MedicalPost(Facility):
    is_24hr: bool = False

class Parking(Facility):
    capacity: int
    available: int

class VenueData(BaseModel):
    name: str
    total_capacity: int
    center_lat: float
    center_lng: float
    gates: List[Gate]
    zones: List[Zone]
    concessions: List[Concession]
    restrooms: List[Restroom]
    medical_posts: List[MedicalPost]
    parking: List[Parking]
