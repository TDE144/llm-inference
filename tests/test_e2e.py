import json
import threading

from http.server import BaseHTTPRequestHandler, HTTPServer

from fastapi.testclient import TestClient

from llm_inference.app import create_app
from llm_inference.config import Settings

STREAM = [
    b'data: {"id":"1","choices":[{"delta":{"content":"Hello"},"index":0}]}\n\n',
    b'data: {"id":"1","choices":[{"delta":{"content":" world"},"index":0}]}\n\n',
    b'data: {"id":"1","choices":[{"delta":{"content":""},"index":0}]}\n\n',
    b"data: [DONE]\n\n",
]


class FakeVLLM(BaseHTTPRequestHandler):
    def log_message(self, *args):
        return

    def _models(self):
        body = json.dumps({"object": "list", "data": [{"id": "demo-model"}]}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self._models()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        self.rfile.read(length)
        if self.headers.get("Accept") == "text/event-stream":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.end_headers()
            for chunk in STREAM:
                self.wfile.write(chunk)
                self.wfile.flush()
        else:
            body = json.dumps(
                {
                    "id": "x",
                    "choices": [
                        {
                            "message": {"role": "assistant", "content": "Hello world"},
                            "index": 0,
                        }
                    ],
                }
            ).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)


def main():
    server = HTTPServer(("127.0.0.1", 0), FakeVLLM)
    port = server.server_address[1]
    threading.Thread(target=server.serve_forever, daemon=True).start()

    settings = Settings(
        vllm_base_url=f"http://127.0.0.1:{port}/v1",
        vllm_api_key="",
        vllm_model="demo-model",
        host="x",
        port=0,
    )
    client = TestClient(create_app(settings))

    r = client.get("/api/health")
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "ok", r.text
    assert r.json()["models"] == ["demo-model"]
    print("health OK:", r.json())

    r = client.post("/api/chat", json={"messages": [{"role": "user", "content": "hi"}]})
    assert r.status_code == 200, r.text
    assert r.json()["reply"] == "Hello world"
    print("chat OK:", r.json())

    with client.stream(
        "POST",
        "/api/chat/stream",
        json={"messages": [{"role": "user", "content": "hi"}]},
    ) as resp:
        assert resp.status_code == 200, resp.status_code
        chunks = resp.iter_text()
        body = list(chunks)
    text = "".join(body)
    assert "Hello" in text and "world" in text
    assert "event: done" in text
    print("stream OK:", text.replace("\n\n", " | "))

    server.shutdown()
    print("ALL TESTS PASSED")


if __name__ == "__main__":
    main()
