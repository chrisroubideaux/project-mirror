# backend/services/emotion_logic.py
# backend/services/emotion_logic.py

from typing import Dict

# ----------------------------------------------------
# 1) CLASSIFY THE USER'S EMOTIONAL STATE FROM PAD
# ----------------------------------------------------
def classify_state(p: float, a: float, d: float) -> str:
    """
    Takes Pleasure (P), Arousal (A), Dominance (D)
    and converts them into a human emotional category.
    """
    if p < 0.3 and a > 0.7:
        return "distress"
    if p < 0.3 and a < 0.4:
        return "sadness"
    if p < 0.4 and d > 0.6:
        return "anger"
    if p > 0.7 and a > 0.6:
        return "joy"
    if p > 0.6 and a < 0.4:
        return "calm"
    if 0.45 < p < 0.6 and 0.4 < a < 0.6:
        return "neutral"

    return "uncertain"


# ----------------------------------------------------
# 2) AURORA'S RESPONSE DICTIONARY
# ----------------------------------------------------
RESPONSE_MAP: Dict[str, str] = {
    "distress": "I'm sensing tension or overwhelm. You're not alone — let's take a moment together.",
    "sadness": "It looks like something might be weighing on you. If you'd like to share, I'm here.",
    "anger": "I can feel some intensity. Let's pause and breathe before moving forward.",
    "joy": "I love this energy! Something good must be happening.",
    "calm": "You seem steady and grounded. Let's stay in this peaceful moment.",
    "neutral": "I'm right here with you. We can continue whenever you're ready.",
    "uncertain": "I'm still reading your expression — give me one more moment."
}


# ----------------------------------------------------
# 3) MAIN RESPONSE ENGINE
# ----------------------------------------------------
def generate_response(p: float, a: float, d: float) -> Dict[str, str]:
    """
    Produces:
      - emotional state label
      - Aurora's natural language response
    """
    state = classify_state(p, a, d)
    message = RESPONSE_MAP.get(state, RESPONSE_MAP["uncertain"])

    return {
        "state": state,
        "aurora_response": message
    }
