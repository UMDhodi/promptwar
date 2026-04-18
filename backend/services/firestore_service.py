import json
import os
import random
from typing import Dict, Any

# Path to seed data fallback
SEED_DATA_PATH = os.path.join(os.path.dirname(__file__), '../../infra/seed_data.json')

class FirestoreService:
    def __init__(self):
        self.use_seed = True
        self.seed_data = {}
        self._load_seed_data()
        
    def _load_seed_data(self):
        if os.path.exists(SEED_DATA_PATH):
            with open(SEED_DATA_PATH, 'r') as f:
                self.seed_data = json.load(f)
                
    def get_venue_status(self) -> Dict[str, Any]:
        """
        Retrieves venue status from Firestore. 
        Falls back to seed_data if Firestore is uninitialized or fails.
        """
        # In a real setup, connect to google-cloud-firestore here
        # return firestore_client.collection('venue').document('status').get().to_dict()
        return self.seed_data.get('venue', {})

    def get_alerts(self) -> list:
        """
        Retrieves active alerts.
        """
        return []

firestore_service = FirestoreService()
