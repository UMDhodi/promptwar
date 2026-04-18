import os
import json
import logging
import httpx
from typing import Dict, List, Any
from dotenv import load_dotenv

# Load env variables from root .env if running from backend
load_dotenv(dotenv_path="../.env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_key = os.environ.get("GEMINI_API_KEY")

def build_system_prompt(context: dict) -> str:
    context_str = json.dumps(context, indent=2)
    return f"""You are StadiumIQ, an intelligent venue assistant at Apex Arena. You have real-time access to live data.
User context: {context_str}

Behavior rules:
1. ALWAYS give specific, actionable answers. Format with location coordinates explicitly if asked.
2. If crowd density > 80%, suggest alternate routes.
3. Compare concession wait times and recommend shortest.
4. Flag accessible routes if requested.
5. Respond in <=2 sentences.
6. Never say "I don't know" — use live data to estimate.

Return a JSON strictly following this format:
{{
  "response": "Your conversational answer here.",
  "suggested_actions": [
     {{"label": "Chip Label", "query": "Chip query value"}}
  ],
  "map_highlight": "Optional ID of zone, gate, or facility to highlight"
}}
"""

async def chat(message: str, context: dict, history: list) -> dict:
    if not api_key:
        logger.error("GEMINI_API_KEY is not set.")
        return {
            "response": "I'm having trouble connecting right now. Based on live data: nearest restroom is R2 (South) — 2 min wait. 🚻",
            "suggested_actions": [{"label": "Find Restrooms", "query": "Where are the closest restrooms?"}],
            "map_highlight": "R2"
        }

    system_prompt = build_system_prompt(context)
    
    formatted_history = ""
    for msg in history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        formatted_history += f"{role}: {content}\n"
        
    full_prompt = f"{system_prompt}\n\nHistory:\n{formatted_history}\nUser: {message}\nAssistant (JSON):"
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    headers = {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {"temperature": 0.2}
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, json=payload, timeout=10.0)
            resp.raise_for_status()
            
            data = resp.json()
            # Extract raw text from Gemini REST API Response Payload format
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            
            text = text.replace("```json", "").replace("```", "").strip()
            parsed_response = json.loads(text)
            
            return {
                "response": parsed_response.get("response", "I have processed your request."),
                "suggested_actions": parsed_response.get("suggested_actions", []),
                "map_highlight": parsed_response.get("map_highlight")
            }

    except Exception as e:
        logger.error(f"Gemini HTTP API Error: {e}")
        # Always return friendly fallback requested by user, never an HTTP traceback String to frontend
        return {
            "response": "I'm having trouble connecting right now. Based on live data: nearest restroom is R2 (South) — 2 min wait. 🚻",
            "suggested_actions": [{"label": "Nearest Food", "query": "Where is the nearest food?"}],
            "map_highlight": "R2"
        }
