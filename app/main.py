from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import webhook
from app.config import settings

app = FastAPI(
    title="SentryPulse n8n Self-Healing Service",
    version="1.0.0",
    description="Autonomous Resilience & Generative Architecture Digital Twin - n8n Automation Track"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhook.router)

@app.get("/")
async def root_health_check():
    return {
        "status": "online",
        "service": "SentryPulse Backend",
        "documentation": "/docs"
    }

@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "healthy", "service": "sentrypulse-n8n-automation"}