from pydantic_settings import BaseSettings
from groq import Groq
import logging

class Settings(BaseSettings):
    app_name: str = "SentryPulse AI War Room"
    groq_api_key: str = ""
    debug_mode: bool = True
    # Healing / demo flags (unified MVP; env-overridable, see .env.example)
    n8n_webhook_url: str = "http://localhost:5678/webhook-test/sentrypulse-trigger"
    demo_fallback_mode: bool = True
    # Live victim site (demo-site/supervisor.py). Empty = synthetic twin.
    # Example: DEMO_SITE_URL=http://127.0.0.1:8004
    demo_site_url: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# Initialize the Groq client for the AI Swarm (live when a key is set)
try:
    groq_client = Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None
    if groq_client is None:
        logging.info("GROQ_API_KEY not set — swarm runs in rule-based fallback mode.")
except Exception as e:
    logging.warning(f"Groq client failed to initialize: {e}. Check your .env file.")
    groq_client = None
