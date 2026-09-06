from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "SentryPulse AI War Room"
    groq_api_key: str = ""
    debug_mode: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
