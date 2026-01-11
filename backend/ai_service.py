import httpx
import json
import os

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
MODEL = "llama3:latest"

async def generate_description(title: str) -> str:
    prompt = f"As a requirement engineer, write a brief, professional description for a software requirement with the title: '{title}'. Return only the description text, no preamble."
    return await _ollama_generate(prompt)

async def generate_rationale(title: str, description: str) -> str:
    prompt = f"As a requirement engineer, write a brief rationale explaining why the following requirement is necessary.\nTitle: {title}\nDescription: {description}\nReturn only the rationale text, no preamble."
    return await _ollama_generate(prompt)

async def _ollama_generate(prompt: str) -> str:
    url = f"{OLLAMA_URL}/api/generate"
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "").strip()
    except Exception as e:
        print(f"Ollama error: {e}")
        return f"Error generating text: {str(e)}"
