from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Email HQ"
    environment: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    database_url: str = "sqlite+aiosqlite:///./emailhq.db"

    credential_encryption_key: str = "changeme-generate-a-real-fernet-key"

    jwt_secret_key: str = "changeme-generate-a-real-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    ai_provider: str = "none"
    ai_api_key: str = ""
    ai_model: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
