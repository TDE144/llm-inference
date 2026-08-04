from __future__ import annotations

import os

from dataclasses import dataclass


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


@dataclass(frozen=True)
class Settings:
    """Runtime configuration, populated from environment variables."""

    # Base URL (with /v1) of the OpenAI-compatible vLLM server.
    vllm_base_url: str
    # Optional API key for the vLLM server.
    vllm_api_key: str
    # Model name to use. Empty string means "auto-detect" from the server.
    vllm_model: str
    # Host/port the chat application binds to.
    host: str
    port: int

    @property
    def default_model(self) -> str:
        return self.vllm_model

    @staticmethod
    def from_env() -> "Settings":
        return Settings(
            vllm_base_url=_env("VLLM_BASE_URL", "http://localhost:8000/v1").rstrip("/"),
            vllm_api_key=_env("VLLM_API_KEY"),
            vllm_model=_env("VLLM_MODEL"),
            host=_env("LLM_INFERENCE_HOST", "127.0.0.1"),
            port=int(_env("LLM_INFERENCE_PORT", "8080")),
        )
