# TRIAL2/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from swarm_engine import MultiAgentSwarmEngine

app = FastAPI(title="SentryPulse - AI Swarm Engine API", version="1.0.0")

# Enable CORS for React Frontend Integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

swarm = MultiAgentSwarmEngine()

@app.get("/")
async def root():
    return {"status": "ACTIVE", "service": "SentryPulse AI Swarm Engine"}

@app.post("/api/v1/triage")
async def trigger_triage(telemetry_data: dict):
    analysis = swarm.process_triage(telemetry_data)
    return {
        "status": "SUCCESS",
        "log_agent": analysis.log_agent_output,
        "predictor_agent": analysis.predictor_agent_output,
        "patch_agent": analysis.patch_agent_output,
        "pareto_options": analysis.pareto_options
    }