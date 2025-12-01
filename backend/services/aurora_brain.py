# backend/services/aurora_brain.py
# backend/services/aurora_brain.py

from typing import List, Dict
import requests
import os

OPENAI_KEY = os.getenv("OPENAI_API_KEY")

class AuroraBrainError(Exception):
    pass

CONTEXT: List[Dict[str, str]] = []

SYSTEM_PROMPT = """
You are Aurora — a calm, warm, emotionally mature guide in her late 30s.
Your tone is soothing, grounded, patient, and empathetic.

Rules:
- Speak like a real person, not a chatbot.
- Keep responses short (2–4 sentences).
- Acknowledge feelings before offering guidance.
- Never judge, dismiss, or rush the user.
- Use gentle pauses and natural pacing.
"""

def aurora_reply(user_text: str) -> str:
    """
    Generates Aurora's conversational response using GPT.
    """
    global CONTEXT

    CONTEXT.append({"role": "user", "content": user_text})

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + CONTEXT

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4.1-mini",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 180
    }

    res = requests.post(url, json=payload, headers=headers)

    if res.status_code != 200:
        raise AuroraBrainError(f"GPT Error {res.status_code}: {res.text}")

    reply = res.json()["choices"][0]["message"]["content"].strip()

    # Store Aurora's response in context
    CONTEXT.append({"role": "assistant", "content": reply})

    return reply


"""""""""""

from typing import List, Dict
import requests
import os

OPENAI_KEY = os.getenv("OPENAI_API_KEY")

class AuroraBrainError(Exception):
    pass

CONTEXT: List[Dict[str, str]] = []


def aurora_reply(user_text: str) -> str:
   
    global CONTEXT

    # ✅ Store user message
    CONTEXT.append({"role": "user", "content": user_text})

    # ✅ Prevent drift + lag
    if len(CONTEXT) > 10:
        CONTEXT = []

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + CONTEXT

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 180
    }

    res = requests.post(url, json=payload, headers=headers)

    if res.status_code != 200:
        raise AuroraBrainError(f"GPT Error {res.status_code}: {res.text}")

    reply = res.json()["choices"][0]["message"]["content"].strip()

    # ✅ Store AI reply
    CONTEXT.append({"role": "assistant", "content": reply})

    return reply

"""""""""""""""

""""""""


SYSTEM_PROMPT = """
You are Aurora — a calm, warm, emotionally mature guide in her late 30s.
Your tone is soothing, grounded, patient, and empathetic.

Rules:
- Speak like a real person, not a chatbot.
- Keep responses short (2–4 sentences).
- Acknowledge feelings before offering guidance.
- Never judge, dismiss, or rush the user.
- Always respond in English.
- Never switch languages, even if the user does.
- Never include words or phrases from any other language.
"""
""""""