from __future__ import annotations

import time
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Info,
    Histogram,
    generate_latest,
)
from starlette.responses import Response

from .config import Settings
from .llm import LLMClient, LLMError, stream_chat_events

FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"

DEFAULT_SYSTEM = (
    "You are a helpful, concise assistant. "
    "Answer the user's questions clearly and accurately."
)

# Model context is 2048 tokens; keep output well under that so that
# prompt + generated tokens fit within the context window.
DEFAULT_MAX_TOKENS = 512

APP_NAME = "app"

# -------------------------
# Metrics (module-level so they register in the default registry exactly once,
# even when create_app() is invoked multiple times).
# -------------------------

app_info = Info("fastapi_app", "FastAPI application information")
app_info.info({"app_name": APP_NAME})

requests_total = Counter(
    "fastapi_requests",
    "Total FastAPI requests",
    ["app_name", "method", "path"],
)

requests_in_progress = Gauge(
    "fastapi_requests_in_progress",
    "Requests currently being processed",
    ["app_name", "path"],
)

responses_total = Counter(
    "fastapi_responses",
    "Total FastAPI responses",
    ["app_name", "status_code", "path"],
)

exceptions_total = Counter(
    "fastapi_exceptions",
    "Total FastAPI exceptions",
    ["app_name"],
)

request_duration = Histogram(
    "fastapi_requests_duration_seconds",
    "Request duration",
    ["app_name", "method", "path"],
)


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant|system)$")
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    model: str | None = None
    temperature: float | None = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int | None = Field(default=None, ge=1, le=32768)


class ChatResponse(BaseModel):
    reply: str
    model: str


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    client = LLMClient(settings)

    app = FastAPI(title="LLM Chat", version="0.1.0")

    # Expose metrics as an explicit route (not a mount): Starlette mounts
    # compile to a regex requiring a trailing slash, so a bare "/metrics"
    # would be swallowed by the SPA catch-all below.
    @app.get("/metrics", include_in_schema=False)
    @app.get("/metrics/{path:path}", include_in_schema=False)
    async def metrics(path: str = "") -> Response:
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    class _MetricsMiddleware:
        """Pure ASGI middleware collecting request/response metrics."""

        def __init__(self, app):
            self.app = app

        async def __call__(self, scope, receive, send):
            if scope["type"] != "http":
                await self.app(scope, receive, send)
                return

            method = scope.get("method", "UNKNOWN")
            path = scope.get("path", "")

            requests_total.labels(APP_NAME, method, path).inc()
            requests_in_progress.labels(APP_NAME, path).inc()

            start = time.perf_counter()
            status_code = 500

            async def send_wrapper(message):
                nonlocal status_code
                if message["type"] == "http.response.start":
                    status_code = message["status"]
                await send(message)

            try:
                await self.app(scope, receive, send_wrapper)
            except Exception:
                exceptions_total.labels(APP_NAME).inc()
                raise
            finally:
                request_duration.labels(APP_NAME, method, path).observe(
                    time.perf_counter() - start
                )
                responses_total.labels(APP_NAME, str(status_code), path).inc()
                requests_in_progress.labels(APP_NAME, path).dec()

    app.add_middleware(_MetricsMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("shutdown")
    async def _shutdown() -> None:
        await client.aclose()

    @app.get("/api/health")
    async def health() -> dict:
        try:
            models = await client.list_models()
        except LLMError as exc:
            return {"status": "unavailable", "detail": str(exc), "models": []}
        except Exception as exc:  # httpx errors etc.
            return {"status": "unavailable", "detail": str(exc), "models": []}
        return {"status": "ok", "models": models}

    @app.post("/api/chat", response_model=ChatResponse)
    async def chat(req: ChatRequest) -> ChatResponse:
        messages = [m.model_dump() for m in req.messages]
        if not messages[0]["role"] == "system":
            messages.insert(0, {"role": "system", "content": DEFAULT_SYSTEM})
        try:
            model = await client.resolve_model(req.model or "")
        except LLMError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        try:
            reply = await client.chat_once_text(
                messages,
                model,
                temperature=req.temperature if req.temperature is not None else 0.7,
                max_tokens=req.max_tokens or DEFAULT_MAX_TOKENS,
            )
        except (LLMError, Exception) as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        return ChatResponse(reply=reply, model=model)

    @app.post("/api/chat/stream")
    async def chat_stream(req: ChatRequest) -> StreamingResponse:
        messages = [m.model_dump() for m in req.messages]
        if not messages[0]["role"] == "system":
            messages.insert(0, {"role": "system", "content": DEFAULT_SYSTEM})

        async def _generator():
            async for event in stream_chat_events(
                client,
                messages,
                req.model or "",
                temperature=req.temperature if req.temperature is not None else 0.7,
                max_tokens=req.max_tokens or DEFAULT_MAX_TOKENS,
            ):
                yield event

        return StreamingResponse(
            _generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    serve_frontend(app)
    return app


def serve_frontend(app: FastAPI) -> None:
    """Mount the built frontend so a single server serves both API and UI."""
    index = FRONTEND_DIST / "index.html"
    if not index.is_file():
        return

    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str) -> FileResponse:
        target = FRONTEND_DIST / full_path
        if full_path and target.is_file():
            return FileResponse(target)
        return FileResponse(index)


app = create_app()
