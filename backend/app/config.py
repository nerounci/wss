from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://wss_user:wss_pass@db:5432/wss_db"
    secret_key: str = "supersecretkeychangeinproduction"
    access_token_expire_minutes: int = 1440
    algorithm: str = "HS256"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
