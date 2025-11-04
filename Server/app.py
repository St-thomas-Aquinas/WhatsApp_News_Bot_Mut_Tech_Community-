# python-summarizer/app.py
from fastapi import FastAPI, Request
import requests
import os

app = FastAPI()
HF_API = os.environ.get("HF_API")  # optional

@app.post("/summarize")
async def summarize(payload: dict):
    text = payload.get("text", "")
    if not text:
        return {"error": "no text"}
    # Example: use Hugging Face Inference API (you can swap to OpenAI)
    if HF_API:
        headers = {"Authorization": f"Bearer {HF_API}"}
        body = {"inputs": text, "parameters": {"max_length": 120}}
        r = requests.post("https://api-inference.huggingface.co/models/facebook/bart-large-cnn", headers=headers, json=body, timeout=30)
        data = r.json()
        return {"summary": data[0]["summary_text"] if isinstance(data, list) else str(data)}
    else:
        # fallback trivial summary (first 300 chars)
        return {"summary": text[:300]}
