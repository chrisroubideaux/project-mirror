# backend/services/emotion_logic.py

from typing import Dict

# ----------------------------------------------------
# 1) CLASSIFY THE USER'S EMOTIONAL STATE (PAD MODEL)
# ----------------------------------------------------
def classify_state(p: float, a: float, d: float) -> str:
    """
    Converts Pleasure (Valence), Arousal, and Dominance
    into a meaningful emotional category.
    """

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
    """
    Returns:
      - emotional state
      - Aurora's therapist-style response
    """
    state = classify_state(p, a, d)
    message = RESPONSE_MAP.get(state, RESPONSE_MAP["uncertain"])

    return {
        "state": state,
        "aurora_response": message
    }




""""""""""
# backend/services/emotion_logic.py
# backend/services/emotion_logic.py

from typing import Dict

# ----------------------------------------------------
# 1) CLASSIFY THE USER'S EMOTIONAL STATE FROM PAD
# ----------------------------------------------------
def classify_state(p: float, a: float, d: float) -> str:
   

    # High tension, low pleasure
    if p < 0.3 and a > 0.7:
        return "distress"

    # Low pleasure, low arousal
    if p < 0.3 and a < 0.4:
        return "sadness"

    # Low pleasure, high dominance
    if p < 0.4 and d > 0.6:
        return "anger"

    # ✅ UPDATED: Joy triggers more easily (soft smiles count)
    if p > 0.7 and a >= 0.5:
        return "joy"

    # Calm, peaceful, low arousal but positive
    if p > 0.6 and a < 0.4:
        return "calm"

    # Middle ranges
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
   
    state = classify_state(p, a, d)
    message = RESPONSE_MAP.get(state, RESPONSE_MAP["uncertain"])

    return {
        "state": state,
        "aurora_response": message
    }



"""""""""