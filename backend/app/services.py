import json
import os
import logging

import fitz  # PyMuPDF
from groq import Groq

from .models import ExtractedResume

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

EXTRACTION_PROMPT = """You are an expert resume parser. Extract the following fields from the resume text below and return ONLY a valid JSON object — no markdown, no explanation, no extra text.

Use this exact JSON schema:
{
  "name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "skills": ["string", ...],
  "experience": [
    {
      "title": "string or null",
      "company": "string or null",
      "duration": "string or null",
      "description": "string or null"
    }
  ],
  "education": [
    {
      "degree": "string or null",
      "institution": "string or null",
      "year": "string or null"
    }
  ]
}

Rules:
- Return ONLY the JSON object, nothing else.
- If a field is not found, use null for strings or an empty array for lists.
- For skills, extract individual skill names as separate strings.
- For experience, extract each position as a separate object.
- For education, extract each degree/certification as a separate object.

Resume text:
"""


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()


def extract_resume_data(raw_text: str) -> ExtractedResume:
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        logger.warning("GROQ_API_KEY not set — returning empty extraction")
        return ExtractedResume()

    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": "You are a precise JSON extractor. Return only valid JSON.",
            },
            {
                "role": "user",
                "content": EXTRACTION_PROMPT + raw_text,
            },
        ],
        temperature=0,
        max_tokens=2048,
    )

    content = response.choices[0].message.content.strip()

    # Strip markdown code fences if present
    if content.startswith("```"):
        lines = content.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        content = "\n".join(lines)

    data = json.loads(content)
    return ExtractedResume(**data)


CHAT_SYSTEM_PROMPT = """You are ResumeIQ Chat Assistant — an expert recruiter AI that helps users analyze resumes. You have been given the text content of one or more resumes uploaded by the user. Use this context to answer their questions accurately.

When answering:
- Reference specific details from the resumes (names, skills, experience, education).
- If comparing multiple resumes, be structured and clear.
- If the user asks something not covered by the resumes, say so honestly.
- Be concise but thorough.

Resume content provided below:
"""


def chat_with_resumes(resume_texts: list[str], messages: list[dict]) -> str:
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return "GROQ_API_KEY is not configured. Please set it to use the chat feature."

    context = CHAT_SYSTEM_PROMPT
    for i, text in enumerate(resume_texts, 1):
        context += f"\n--- Resume {i} ---\n{text}\n"

    client = Groq(api_key=api_key)
    groq_messages = [{"role": "system", "content": context}]
    for msg in messages:
        groq_messages.append({"role": msg["role"], "content": msg["content"]})

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=groq_messages,
        temperature=0.3,
        max_tokens=2048,
    )

    return response.choices[0].message.content.strip()


def validate_pdf(filename: str, size: int) -> str | None:
    if not filename.lower().endswith(".pdf"):
        return "Only PDF files are accepted."
    if size > MAX_FILE_SIZE:
        return f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)} MB."
    return None
