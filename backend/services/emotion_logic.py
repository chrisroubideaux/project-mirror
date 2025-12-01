# backend/services/emotion_logic.py

from typing import Dict

# ----------------------------------------------------
# 1) CLASSIFY EMOTIONAL STATE (PAD MODEL)
# ----------------------------------------------------
def classify_state(p: float, a: float, d: float) -> str:
    """
    Convert Pleasure (Valence), Arousal, and Dominance
    into a simple emotional state category.
    """
    if p < 0.3 and a > 0.7:
        return "distress"

    if p < 0.3 and a < 0.4:
        return "sadness"

    if p < 0.4 and d > 0.6:
        return "anger"

    if p > 0.7 and a >= 0.45:
        return "joy"

    if p > 0.6 and a < 0.4:
        return "calm"

    if 0.45 < p < 0.6 and 0.4 < a < 0.6:
        return "neutral"

    return "uncertain"


# ----------------------------------------------------
# 2) EMOTION RESULT (NO AURORA RESPONSE)
# ----------------------------------------------------
def emotion_signal(p: float, a: float, d: float) -> Dict[str, float | str]:
    """
    Returns emotion signal ONLY.
    Aurora does NOT speak based on emotion.
    """
    state = classify_state(p, a, d)

    return {
        "state": state,
        "valence": p,
        "arousal": a,
        "dominance": d,
    }



""""""""""
# backend/services/emotion_logic.py

from typing import Dict

# ----------------------------------------------------
# 1) CLASSIFY THE USER'S EMOTIONAL STATE (PAD MODEL)
# ----------------------------------------------------
def classify_state(p: float, a: float, d: float) -> str:
   

    if p < 0.3 and a > 0.7:
        return "distress"

    if p < 0.3 and a < 0.4:
        return "sadness"

    if p < 0.4 and d > 0.6:
        return "anger"

    # ✅ Catch soft smiles, relaxed happiness
    if p > 0.7 and a >= 0.45:
        return "joy"

    if p > 0.6 and a < 0.4:
        return "calm"

    if 0.45 < p < 0.6 and 0.4 < a < 0.6:
        return "neutral"

    return "uncertain"


# ----------------------------------------------------
# 2) AURORA'S EMPATHETIC THERAPIST RESPONSES
# ----------------------------------------------------
RESPONSE_MAP: Dict[str, str] = {
    "distress": (
        "It looks like something may feel intense right now. "
        "Take a slow breath. You're safe, and I'm right here with you."
    ),
    "sadness": (
        "I’m sensing some heaviness. Whatever you're going through matters. "
        "You don’t have to carry it alone."
    ),
    "anger": (
        "There’s some strong energy there. It's okay to feel that. "
        "Let’s pause for a moment and steady ourselves together."
    ),
    "joy": (
        "Something seems to be bringing you some light. "
        "Let’s stay with that feeling for a moment."
    ),
    "calm": (
        "You seem grounded and peaceful. "
        "Let’s hold onto this sense of balance."
    ),
    "neutral": (
        "I'm here with you. We can move at whatever pace feels comfortable."
    ),
    "uncertain": (
        "I’m still getting a read on your expression. "
        "Give me just another moment."
    ),
}


# ----------------------------------------------------
# 3) MAIN RESPONSE ENGINE
# ----------------------------------------------------
def generate_response(p: float, a: float, d: float) -> Dict[str, str]:
    
    state = classify_state(p, a, d)
    message = RESPONSE_MAP.get(state, RESPONSE_MAP["uncertain"])

    return {
        "state": state,
        "aurora_response": message
    }



"""""""""