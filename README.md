# StadiumIQ — Smart Venue Assistant

## Vertical
Large-scale sporting event attendee experience: crowd management, wait-time reduction, real-time navigation.

## Approach & Logic
StadiumIQ combines Gemini AI (contextual reasoning) + live Firestore data (real-time venue state) + Google Maps (spatial navigation) to give attendees a personal stadium guide in their pocket.

**Decision flow:**
1. User asks question or taps quick action
2. Backend fetches live venue state from Firestore
3. Gemini receives: user message + full venue context (crowd density, wait times, user location/seat/accessibility needs)
4. Gemini returns: natural language answer + structured actions + map highlight point
5. Frontend updates chat, pulses map marker, shows quick-reply chips

**Crowd engine logic:**
- Density score = occupancy/capacity × 100
- Movement risk multiplier at halftime/event-end = 1.5×
- Routing avoids zones >70% density
- Predictions use 5-reading linear extrapolation

## How It Works
1. User opens app → anonymous Firebase auth → enters seat number + accessibility preference
2. Map shows live heatmap of crowd density across all zones
3. Chat with Gemini: "Where's the shortest food queue?" → gets specific concession + walking route
4. Wait Time dashboard shows all facilities ranked by queue length
5. Real-time alerts pushed via FCM for crowd surges, gate delays, emergencies

## Google Services Used
| Service | Usage |
|---------|-------|
| Vertex AI (Gemini 1.5 Flash) | Conversational assistant + decision engine |
| Google Maps JS API | Interactive venue map |
| Google Routes API | Walking navigation inside venue |
| Maps Heatmap Layer | Real-time crowd density visualization |
| Cloud Firestore | Real-time venue state + user profiles |
| Firebase Auth | Anonymous + Google Sign-In |
| Firebase Hosting | Frontend deployment |
| Cloud Run | Backend API hosting |
| Firebase Cloud Messaging | Push alerts |
| Secret Manager | API key security |
| Cloud Build | CI/CD pipeline |
| BigQuery | (Schema ready) Analytics + crowd pattern storage |

## Assumptions
- Venue staff update zone occupancy via separate admin interface (simulated by seed + background job)
- Google Routes API used for pedestrian routing approximation inside venue
- Single active event per venue at a time
- Mobile-first: most users on phone inside stadium
- Anonymous auth sufficient for 90% of features; sign-in only needed to save preferences

## Local Dev Setup
```bash
# Backend
cd backend && pip install -r requirements.txt
export GOOGLE_CLOUD_PROJECT=your-project-id
uvicorn main:app --reload

# Frontend  
cd frontend && npm install
echo "VITE_MAPS_API_KEY=your-key" > .env.local
npm run dev
```

## Testing
```bash
cd backend && pytest tests/ -v
```
