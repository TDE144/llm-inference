from __future__ import annotations

import uvicorn

from .config import Settings
from .app import create_app

__all__ = ["app", "main"]

app = create_app(Settings.from_env())


def main() -> None:
    settings = Settings.from_env()
    uvicorn.run(
        "llm_inference.app:app",
        host=settings.host,
        port=settings.port,
        reload=False,
    )


if __name__ == "__main__":
    main()
