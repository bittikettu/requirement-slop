import httpx
import json
import os

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
MODEL = "llama3:latest"

async def generate_description(title: str):
    prompt = f"As a requirements engineer, write a brief, professional description for a software requirement with the title: '{title}'.\n Return only the description text, no preamble."
    async for chunk in _ollama_generate(prompt):
        yield chunk

async def generate_rationale(title: str, description: str):
    prompt = f"As a requirements engineer, write a concise rationale explaining why the following requirement is necessary. Focus on the underlying need, risk, or business/technical value it addresses. Do not restate the requirement.\nTitle: {title}\nDescription: {description}\nReturn only the rationale text, no preamble."
    async for chunk in _ollama_generate(prompt):
        yield chunk

async def _ollama_generate(prompt: str):
    url = f"{OLLAMA_URL}/api/generate"
    payload = {
        "model": MODEL,
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
