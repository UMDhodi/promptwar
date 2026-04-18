# StadiumIQ — Smart Venue Assistant

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://github.com)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%202.0-blue)](https://ai.google.dev)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB)](https://react.dev)

> AI-powered smart venue assistant for Apex Arena — real-time crowd navigation, wait-time prediction, and event coordination.

---

## 🏟️ What Is StadiumIQ?

StadiumIQ is a **hackathon-grade production web app** that helps 60,000+ stadium attendees navigate Apex Arena in real time. It answers natural language questions like:

- *"Where's the nearest restroom?"* → highlights R2 on the map + draws a route
- *"What's the fastest exit?"* → compares all 4 gate queues, recommends best
- *"How crowded is the East Stand?"* → shows live density 92%, suggests alternate seats

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Chat Assistant** | Gemini 2.0 Flash powered conversational assistant |
| 🗺️ **Interactive Venue Map** | Pan/zoom SVG map with live crowd density zones |
| 📍 **Turn-by-Turn Navigation** | Click any marker → animated dashed route from your seat |
| ⏱️ **Live Wait Times** | Real-time simulated queue data for gates, food, restrooms |
| 🚻 **Full Live Directory** | Gates, Concessions, Restrooms, Medical, Parking |
| ♿ **Accessible Routes** | Toggle to filter accessible-only facilities |
| 🔔 **Alert Banner** | Dismissible live alerts (e.g., "North Gate 20min delay") |
| 📱 **Mobile-First** | Fully responsive design |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/PromptWars.git
cd PromptWars
```

### 2. Set up environment
Create `frontend/.env`:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_URL=http://localhost:8000/api
```

### 3. Run the frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

### 4. (Optional) Run the backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python main.py
```

---

## 🏗️ Architecture

```
PromptWars/
├── frontend/          # React 18 + Vite + TailwindCSS 4
│   ├── src/
│   │   ├── components/
│   │   │   ├── VenueMap.jsx          # Interactive SVG map
│   │   │   ├── ChatAssistant.jsx     # Chat UI
│   │   │   ├── WaitTimeDashboard.jsx # Live Directory panel
│   │   │   ├── OnboardingModal.jsx   # First-time setup
│   │   │   └── AlertBanner.jsx       # Dismissible alerts
│   │   ├── hooks/
│   │   │   ├── useGemini.js          # Gemini AI + smart fallback
│   │   │   └── useFirestore.js       # Mock real-time data engine
│   │   └── services/
│   │       └── api.js                # Backend proxy with timeout
├── backend/           # Python zero-dependency HTTP server
│   ├── main.py        # FastAPI-compatible REST proxy to Gemini
│   └── services/
│       └── gemini_service.py
├── infra/             # Firebase + Firestore config
└── cloudbuild.yaml    # GCP CI/CD pipeline
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS 4 |
| AI | Google Gemini 2.0 Flash (direct API) |
| Icons | Lucide React |
| Data | Simulated Firestore real-time data |
| Backend | Python stdlib HTTP server (zero deps) |
| CI/CD | Google Cloud Build |
| Hosting | Firebase Hosting (frontend) |

---

## 🔑 Environment Variables

| Variable | Where | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | `frontend/.env` | Your Google Gemini API key |
| `VITE_API_URL` | `frontend/.env` | Backend URL (default: localhost:8000/api) |
| `GEMINI_API_KEY` | `backend/.env` | Backend Gemini key (if running backend) |

> ⚠️ **Never commit `.env` files.** They are listed in `.gitignore`.

---

## 📸 Screenshots

The app provides:
- A real-time crowd density heatmap across all 4 stadium zones
- Marker pins for gates 🚪, food 🍔, restrooms 🚻, medical ⛑️, parking 🅿️
- Animated dashed routes from your seat to any facility
- A full live directory with wait times and "BEST" badges

---

## 🙏 Built At

**PromptWars Hackathon 2026** — Powered by Google Cloud & Gemini AI
