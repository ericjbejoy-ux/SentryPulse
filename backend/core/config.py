from pydantic_settings import BaseSettings
from groq import Groq
import logging

class Settings(BaseSettings):
    app_name: str = "SentryPulse AI War Room"
    groq_api_key: str = ""
    debug_mode: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Initialize the Groq client for the AI Swarm
try:
    groq_client = Groq(api_key=settings.groq_api_key)
except Exception as e:
    logging.warning(f"Groq client failed to initialize: {e}. Check your .env file.")
    groq_client = None
