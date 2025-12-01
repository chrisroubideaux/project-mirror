# backend/services/aurora_dialogue.py
def generate_dialogue_response(user_text, state, p, a, d):
    user_text = user_text.lower()

    if state == "distress":
        return "It sounds like things feel overwhelming. What part feels the heaviest right now?"
    if state == "sadness":
        return "I'm hearing some pain in what you're saying. What do you feel you need most in this moment?"
    if state == "anger":
        return "It makes sense to feel intense when something matters. What triggered this feeling?"
    if state == "joy":
        return "I love hearing that. What’s bringing you that sense of happiness?"
    if state == "calm":
        return "You seem grounded. What's helping you stay centered right now?"

    # fallback
    return "I'm here with you. Tell me more about what's on your mind."
