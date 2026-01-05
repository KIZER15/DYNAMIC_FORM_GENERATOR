from fastapi import FastAPI
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import google.generativeai as genai
import json
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()

# -------- Configure Gemini --------
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------- Request Schema --------
class PromptRequest(BaseModel):
    prompt: str

# -------- LLM Endpoint --------
@app.post("/generate-form")
def generate_form(data: PromptRequest):
    model = genai.GenerativeModel("gemini-2.5-flash")

    full_prompt = f"""
You are a form schema generator.

STRICT OUTPUT FORMAT (MANDATORY):
Return a JSON OBJECT with EXACTLY this structure:

{{
  "title": "string",
  "fields": [
    {{
      "label": "string",
      "name": "string",
      "type": "text | number | email | textarea",
      "required": boolean,
      "meta": ["string"]
    }}
  ]
}}

RULES:
- Do NOT return an array at top level
- Do NOT return markdown
- Do NOT return explanations
- JSON only

USER REQUEST:
{data.prompt}
"""

    response = model.generate_content(full_prompt)
    raw = response.text

    try:
        parsed = json.loads(raw)

        # 🔒 HARD NORMALIZATION
        if isinstance(parsed, list):
            return {
                "title": "Generated Form",
                "fields": parsed
            }

        if isinstance(parsed, dict) and "fields" in parsed:
            return parsed

        return {
            "title": "Generated Form",
            "fields": []
        }

    except Exception:
        return {
            "title": "Generated Form",
            "fields": []
        }
