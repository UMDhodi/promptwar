import os
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.request
import urllib.error
import traceback

def load_env():
    try:
        with open("../.env", "r") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    k, v = line.strip().split("=", 1)
                    os.environ[k] = v
    except FileNotFoundError:
        pass

load_env()

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

class SimpleGeminiHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/chat':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            message = data.get("message", "")
            context = data.get("userContext", {})
            history = data.get("history", [])
            
            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                 fallback = {
                     "response": "I'm having trouble connecting right now. Missing API key!",
                     "suggested_actions": [],
                     "map_highlight": "R2"
                 }
                 self.send_response(200)
                 self.send_header('Content-Type', 'application/json')
                 self.send_header('Access-Control-Allow-Origin', '*')
                 self.end_headers()
                 self.wfile.write(json.dumps(fallback).encode('utf-8'))
                 return
                 
            system_prompt = build_system_prompt(context)
            formatted_history = ""
            for msg in history:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                formatted_history += f"{role}: {content}\n"
                
            full_prompt = f"{system_prompt}\n\nHistory:\n{formatted_history}\nUser: {message}\nAssistant (JSON):"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
            payload = json.dumps({
                "contents": [{"parts": [{"text": full_prompt}]}],
                "generationConfig": {"temperature": 0.2}
            }).encode('utf-8')
            
            req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
            
            try:
                with urllib.request.urlopen(req, timeout=5.0) as response:
                    resp_data = json.loads(response.read().decode('utf-8'))
                    text = resp_data["candidates"][0]["content"]["parts"][0]["text"]
                    text = text.replace("```json", "").replace("```", "").strip()
                    parsed_response = json.loads(text)
                    
                    final_resp = {
                        "response": parsed_response.get("response", "Request processed."),
                        "suggested_actions": parsed_response.get("suggested_actions", []),
                        "map_highlight": parsed_response.get("map_highlight")
                    }
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(final_resp).encode('utf-8'))
            except urllib.error.HTTPError as e:
                err_msg = e.read().decode('utf-8')
                print("Gemini HTTP Error:", err_msg)
                with open("error_log.txt", "w") as f:
                    f.write(err_msg)
                fallback = {
                     "response": f"HTTP Error {e.code}. Check error_log.txt",
                     "suggested_actions": [],
                     "map_highlight": "G2"
                }
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(fallback).encode('utf-8'))
            except Exception as e:
                err_str = traceback.format_exc()
                with open("error_log.txt", "w") as f:
                    f.write(err_str)
                print("Gemini API Error:", e)
                fallback = {
                     "response": "Connectivity error. Check error_log.txt internally.",
                     "suggested_actions": [],
                     "map_highlight": "G2"
                }
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(fallback).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def run(server_class=HTTPServer, handler_class=SimpleGeminiHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting lightweight zero-dependency Python backend server on port {port}...")
    httpd.serve_forever()

if __name__ == "__main__":
    run()
