import httpx
import json
import os

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
DEFAULT_MODEL = "llama3:latest"

async def list_models():
    url = f"{OLLAMA_URL}/api/tags"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            return [m["name"] for m in data.get("models", [])]
    except Exception as e:
        print(f"Ollama list models error: {e}")
        return [DEFAULT_MODEL]

async def generate_description(title: str, model: str = None):
    prompt = f"As a requirements engineer, write a brief, professional description for a software requirement with the title: '{title}'.\n Return only the description text, no preamble."
    async for chunk in _ollama_generate(prompt, model):
        yield chunk

async def generate_rationale(title: str, description: str, model: str = None):
    prompt = f"As a requirements engineer, write a concise rationale explaining why the following requirement is necessary. Focus on the underlying need, risk, or business/technical value it addresses. Do not restate the requirement.\nTitle: {title}\nDescription: {description}\nReturn only the rationale text, no preamble."
    async for chunk in _ollama_generate(prompt, model):
        yield chunk

async def _ollama_generate(prompt: str, model: str = None):
    url = f"{OLLAMA_URL}/api/generate"
    payload = {
        "model": model or DEFAULT_MODEL,
        "prompt": prompt,
        "stream": True
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("POST", url, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        data = json.loads(line)
                        chunk = data.get("response", "")
                        if chunk:
                            yield chunk
                        if data.get("done"):
                            break
    except Exception as e:
        print(f"Ollama error: {e}")
        yield f"Error generating text: {str(e)}"
