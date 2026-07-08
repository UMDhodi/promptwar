import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.alerts import router as alerts_router
from routers.assistant import router as assistant_router
from routers.navigation import router as navigation_router
from routers.venue import router as venue_router

# Load environment variables from parent .env if present
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path="../.env")
except ImportError:
    pass

app = FastAPI(title="FIFAiq API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api prefix
app.include_router(alerts_router, prefix="/api")
app.include_router(assistant_router, prefix="/api")
app.include_router(navigation_router, prefix="/api")
app.include_router(venue_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
