from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    TWIN_STATE_PATH: str = "backend/telemetry/twin.py"
    N8N_WEBHOOK_URL: str = "http://localhost:5678/webhook-test/9dc9c5e5-9c08-4d22-ae45-d15700bab20c"
    DEMO_FALLBACK_MODE: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()