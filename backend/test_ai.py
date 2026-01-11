import asyncio
import httpx

async def test_generation():
    url = "http://localhost:8000/requirements/generate-description"
    payload = {"title": "The user shall be able to log in with email and password"}
    
    print(f"Testing description generation with title: {payload['title']}")
    try:
        async with httpx.AsyncClient(timeout=40.0) as client:
            response = await client.post(url, json=payload)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_generation())
