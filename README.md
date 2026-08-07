# llm-inference

LLM inference сервис на базе vLLM с веб-чатом — сервят Qwen/Qwen2.5-0.5B-Instruct через OpenAI-совместимый API.

## Запуск

```bash
git clone https://github.com/TDE144/llm-inference.git
cd llm-inference
docker compose up --build
```

## Адреса

- Чат (frontend): http://localhost:8080
- OpenAI API (vLLM): http://localhost:8000/v1