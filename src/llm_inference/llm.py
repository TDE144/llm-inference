from __future__ import annotations

import json

from typing import Any, AsyncIterator

import httpx

from .config import Settings


class LLMError(RuntimeError):
    """Raised when the vLLM server can not be reached or returns an error."""


class LLMClient:
    """Minimal OpenAI-compatible client for a local vLLM server."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if settings.vllm_api_key:
            headers["Authorization"] = f"Bearer {settings.vllm_api_key}"
        self._client = httpx.AsyncClient(
            base_url=settings.vllm_base_url,
            headers=headers,
            timeout=httpx.Timeout(connect=15.0, read=None, write=30.0, pool=15.0),
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def resolve_model(self, requested: str) -> str:
        if requested:
            return requested
        if self._settings.default_model:
            return self._settings.default_model
        model = await self.list_models()
        if not model:
            raise LLMError("Could not determine the model: /v1/models returned nothing")
        return model

    async def list_models(self) -> list[str]:
        response = await self._client.get("/models")
        response.raise_for_status()
        payload = response.json()
        return [m["id"] for m in payload.get("data", [])]

    def _payload(
        self,
        messages: list[dict[str, str]],
        model: str,
        *,
        stream: bool,
        temperature: float,
        max_tokens: int,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": stream,
        }
        if temperature is not None:
            payload["temperature"] = temperature
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens
        return payload

    @staticmethod
    def _parse_delta(line: str) -> str | None:
        if not line or not line.startswith("data:"):
            return None
        data = line[len("data:") :].strip()
        if data == "[DONE]":
            return None
        try:
            payload = json.loads(data)
        except json.JSONDecodeError:
            return None
        try:
            delta = payload["choices"][0]["delta"].get("content")
        except (KeyError, IndexError, TypeError):
            delta = None
        return delta or None

    async def chat_once_text(
        self,
        messages: list[dict[str, str]],
        model: str,
        *,
        temperature: float,
        max_tokens: int,
    ) -> str:
        payload = self._payload(
            messages,
            model,
            stream=False,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        try:
            response = await self._client.post("/chat/completions", json=payload)
        except (httpx.HTTPError, OSError) as exc:
            raise LLMError(
                f"Failed to reach vLLM at {self._settings.vllm_base_url}: {exc}"
            ) from exc
        response.raise_for_status()
        payload_json = response.json()
        if "error" in payload_json:
            raise LLMError(str(payload_json["error"]))
        content = payload_json["choices"][0]["message"].get("content") or ""
        return content

    async def chat_stream(
        self,
        messages: list[dict[str, str]],
        model: str,
        *,
        temperature: float,
        max_tokens: int,
    ) -> AsyncIterator[str]:
        """Yield text deltas parsed from the SSE stream."""
        payload = self._payload(
            messages, model, stream=True, temperature=temperature, max_tokens=max_tokens
        )
        try:
            async with self._client.stream(
                "POST",
                "/chat/completions",
                json=payload,
                headers={"Accept": "text/event-stream"},
            ) as resp:
                if resp.status_code != 200:
                    body = await resp.aread()
                    raise LLMError(
                        f"vLLM error {resp.status_code}: {body.decode(errors='replace')[:500]}"
                    )
                buffer = ""
                async for chunk in resp.aiter_bytes():
                    buffer += chunk.decode(errors="replace")
                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        line = line.strip()
                        if line == "[DONE]":
                            return
                        delta = self._parse_delta(line)
                        if delta:
                            yield delta
        except (httpx.HTTPError, OSError) as exc:
            raise LLMError(
                f"Failed to reach vLLM at {self._settings.vllm_base_url}: {exc}"
            ) from exc


async def stream_chat_events(
    client: LLMClient,
    messages: list[dict[str, str]],
    model: str,
    *,
    temperature: float,
    max_tokens: int,
) -> AsyncIterator[str]:
    """Yield SSE-formatted events for the frontend."""
    try:
        model = await client.resolve_model(model)
    except LLMError as exc:
        yield f"event: error\ndata: {json.dumps({'message': str(exc)})}\n\n"
        return

    full = ""
    try:
        async for delta in client.chat_stream(
            messages, model, temperature=temperature, max_tokens=max_tokens
        ):
            full += delta
            yield f"data: {json.dumps({'delta': delta})}\n\n"
    except LLMError as exc:
        yield f"event: error\ndata: {json.dumps({'message': str(exc)})}\n\n"
        return

    yield f"event: done\ndata: {json.dumps({'message': full})}\n\n"
