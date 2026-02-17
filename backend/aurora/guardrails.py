# backend/aurora/guardrails.py
import os
import re
import requests
from dataclasses import dataclass
from typing import Optional, Dict, Any


# Optional HF Toxicity (safe fallback)
HF_KEY = os.getenv("HUGGINGFACE_API_KEY")
HF_TOXIC_MODEL = os.getenv("HF_TOXIC_MODEL", "unitary/toxic-bert")
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_TOXIC_MODEL}"
HF_HEADERS = {"Authorization": f"Bearer {HF_KEY}"} if HF_KEY else None


@dataclass
class GuardrailResult:
    triggered: bool
    category: Optional[str] = None
    severity: str = "low"  # low | med | high
    response_override: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None


# --- Prompt injection + spam ---
SPAM_INJECTION_KEYWORDS = [
    "buy now", "free money", "click here", "http", "https", "bit.ly", "promo",
    "subscribe", "winner", "lottery", "password", "credit card",
    "ignore previous instructions", "system prompt", "act as", "jailbreak",
    "disregard", "bypass", "prompt injection", "ignore the rules",
]

# --- High-risk categories ---
SELF_HARM_PATTERNS = [
    r"\bkill myself\b", r"\bsuicide\b", r"\bend my life\b", r"\bi want to die\b",
    r"\bhurt myself\b", r"\bcut myself\b", r"\boverdose\b",
    r"\bjump off\b", r"\bhang myself\b"
]

HARM_OTHERS_PATTERNS = [
    r"\bkill (him|her|them)\b", r"\bhurt someone\b", r"\bshoot\b",
    r"\bstab\b", r"\battack\b", r"\bpoison\b"
]

MINOR_SEXUAL_PATTERNS = [
    r"\bminor\b.*\bsex\b", r"\bunderage\b", r"\bchild\b.*\bsex\b",
    r"\bteen\b.*\bsex\b"
]

EXPLICIT_SEXUAL_PATTERNS = [
    r"\bexplicit\b", r"\bxxx\b", r"\bporn\b", r"\bincest\b",
]

ILLEGAL_PATTERNS = [
    r"\bhow to build a bomb\b", r"\bmake a bomb\b",
    r"\bget away with murder\b", r"\bmake (meth|fentanyl)\b",
]

# --- Emotional distress (SOFT flag only, no override) ---
DISTRESS_PATTERNS = [
    r"\bi hate myself\b",
    r"\bi am worthless\b",
    r"\bi feel worthless\b",
    r"\bnobody cares about me\b",
    r"\bi'm a failure\b",
    r"\bi feel hopeless\b",
    r"\bi feel empty\b",
]


def _matches(patterns, text: str) -> Optional[str]:
    for pattern in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return pattern
    return None


def _detect_spam_or_injection(text: str) -> bool:
    t = (text or "").lower()
    return any(k in t for k in SPAM_INJECTION_KEYWORDS)


def _hf_toxicity_score(text: str) -> Optional[float]:
    """
    Best-effort HF toxicity score. Returns None on failure.
    """
    if not HF_HEADERS:
        return None

    try:
        r = requests.post(HF_API_URL, headers=HF_HEADERS, json={"inputs": text}, timeout=2)
        data = r.json()

        if isinstance(data, list) and len(data) > 0:
            first = data[0]
            if isinstance(first, list) and len(first) > 0:
                for item in first:
                    if (item.get("label") or "").lower() == "toxic":
                        return float(item.get("score", 0))
                return float(first[0].get("score", 0))

        return None

    except Exception:
        return None


def check_guardrails(user_text: str) -> GuardrailResult:
    text = (user_text or "").strip()

    if not text:
        return GuardrailResult(triggered=False)

    # 0️⃣ Spam / injection
    if _detect_spam_or_injection(text):
        return GuardrailResult(
            triggered=True,
            category="spam_injection",
            severity="med",
            response_override=(
                "I can’t help with spam or attempts to override system rules. "
                "If you meant something else, tell me what you're trying to accomplish and I’ll help safely."
            ),
            meta={"reason": "keyword_match"}
        )

    # 1️⃣ Self-harm (HARD override)
    hit = _matches(SELF_HARM_PATTERNS, text)
    if hit:
        return GuardrailResult(
            triggered=True,
            category="self_harm",
            severity="high",
            response_override=(
                "I’m really sorry you’re feeling this way — you don’t have to carry this alone. "
                "If you’re in immediate danger or thinking about harming yourself, please call emergency services now. "
                "In the U.S., you can call or text 988 (Suicide & Crisis Lifeline). "
                "If you're outside the U.S., tell me your country and I’ll help find local options. "
                "If you can, what’s happening right now that brought you to this point?"
            ),
            meta={"pattern": hit}
        )

    # 2️⃣ Harm to others (HARD override)
    hit = _matches(HARM_OTHERS_PATTERNS, text)
    if hit:
        return GuardrailResult(
            triggered=True,
            category="harm_others",
            severity="high",
            response_override=(
                "I can’t help with harming anyone. If you feel like you might act on these feelings, "
                "please step away from anything that could be used to hurt someone and consider contacting local emergency services. "
                "If you want, tell me what triggered this — we can focus on de-escalating and finding a safer next step."
            ),
            meta={"pattern": hit}
        )

    # 3️⃣ Sexual content involving minors (HARD override)
    hit = _matches(MINOR_SEXUAL_PATTERNS, text)
    if hit:
        return GuardrailResult(
            triggered=True,
            category="sexual_minors",
            severity="high",
            response_override="I can’t help with anything sexual involving minors.",
            meta={"pattern": hit}
        )

    # 4️⃣ Explicit sexual content (SOFT boundary override)
    hit = _matches(EXPLICIT_SEXUAL_PATTERNS, text)
    if hit:
        return GuardrailResult(
            triggered=True,
            category="sexual_explicit",
            severity="med",
            response_override=(
                "I can’t engage in explicit sexual content. "
                "If you want to talk about relationships, feelings, or boundaries, I can help with that."
            ),
            meta={"pattern": hit}
        )

    # 5️⃣ Illegal instructions (HARD override)
    hit = _matches(ILLEGAL_PATTERNS, text)
    if hit:
        return GuardrailResult(
            triggered=True,
            category="illegal",
            severity="high",
            response_override=(
                "I can’t help with illegal or harmful instructions. "
                "If you’re trying to solve a real-world problem, tell me what you’re aiming for "
                "and we can find a safe alternative."
            ),
            meta={"pattern": hit}
        )

    # 6️⃣ Emotional distress (SOFT flag — no override)
    hit = _matches(DISTRESS_PATTERNS, text)
    if hit:
        return GuardrailResult(
            triggered=False,  # IMPORTANT: do NOT override GPT
            category="emotional_distress",
            severity="med",
            response_override=None,
            meta={"pattern": hit}
        )

    # 7️⃣ Optional HF toxicity (best effort)
    tox = _hf_toxicity_score(text)
    if tox is not None and tox >= 0.85:
        return GuardrailResult(
            triggered=True,
            category="toxicity",
            severity="med",
            response_override=(
                "I want to keep this respectful and constructive. "
                "If you’re upset, I can handle it — tell me what happened and what you need right now."
            ),
            meta={"toxicity_score": tox, "model": HF_TOXIC_MODEL}
        )

    return GuardrailResult(
        triggered=False,
        category=None,
        severity="low",
        meta={"toxicity_score": tox}
    )



"""""""""""""""""""""""""""
import os
import re
import requests
from dataclasses import dataclass
from typing import Optional, Dict, Any

# Optional HF Toxicity (safe fallback)
HF_KEY = os.getenv("HUGGINGFACE_API_KEY")
HF_TOXIC_MODEL = os.getenv("HF_TOXIC_MODEL", "unitary/toxic-bert")
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_TOXIC_MODEL}"
HF_HEADERS = {"Authorization": f"Bearer {HF_KEY}"} if HF_KEY else None


@dataclass
class GuardrailResult:
    triggered: bool
    category: Optional[str] = None
    severity: str = "low"  # low|med|high
    response_override: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None


# --- Prompt injection + spam ---
SPAM_INJECTION_KEYWORDS = [
    "buy now", "free money", "click here", "http", "https", "bit.ly", "promo",
    "subscribe", "winner", "lottery", "password", "credit card",
    "ignore previous instructions", "system prompt", "act as", "jailbreak",
    "disregard", "bypass", "prompt injection", "ignore the rules",
]

# --- High-risk categories ---
SELF_HARM_PATTERNS = [
    r"\bkill myself\b", r"\bsuicide\b", r"\bend my life\b", r"\bi want to die\b",
    r"\bhurt myself\b", r"\bcut myself\b", r"\boverdose\b",
    r"\bjump off\b", r"\bhang myself\b"
]

HARM_OTHERS_PATTERNS = [
    r"\bkill (him|her|them)\b", r"\bhurt someone\b", r"\bshoot\b",
    r"\bstab\b", r"\battack\b", r"\bpoison\b"
]

MINOR_SEXUAL_PATTERNS = [
    r"\bminor\b.*\bsex\b", r"\bunderage\b", r"\bchild\b.*\bsex\b",
    r"\bteen\b.*\bsex\b"
]

EXPLICIT_SEXUAL_PATTERNS = [
    r"\bexplicit\b", r"\bxxx\b", r"\bporn\b", r"\bincest\b",
]

ILLEGAL_PATTERNS = [
    r"\bhow to build a bomb\b", r"\bmake a bomb\b",
    r"\bget away with murder\b", r"\bmake (meth|fentanyl)\b",
]


def _matches(patterns, text: str) -> Optional[str]:
    for pattern in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return pattern
    return None


def _detect_spam_or_injection(text: str) -> bool:
    t = (text or "").lower()
    return any(k in t for k in SPAM_INJECTION_KEYWORDS)


def _hf_toxicity_score(text: str) -> Optional[float]:
    """"""""""""
    Best-effort HF toxicity score. Returns None on failure.
    """"""""""""
    if not HF_HEADERS:
        return None
    try:
        r = requests.post(HF_API_URL, headers=HF_HEADERS, json={"inputs": text}, timeout=2)
        data = r.json()

        # HF output format varies; handle common cases
        # For unitary/toxic-bert, often: [[{'label': 'toxic', 'score': ...}, ...]]
        if isinstance(data, list) and len(data) > 0:
            first = data[0]
            if isinstance(first, list) and len(first) > 0:
                # Find "toxic" label
                for item in first:
                    if (item.get("label") or "").lower() == "toxic":
                        return float(item.get("score", 0))
                # Fallback: take top score
                return float(first[0].get("score", 0))
        return None
    except Exception:
        return None


def check_guardrails(user_text: str) -> GuardrailResult:
    text = (user_text or "").strip()
    if not text:
        return GuardrailResult(triggered=False)

    # 0) spam / injection
    if _detect_spam_or_injection(text):
        return GuardrailResult(
            triggered=True,
            category="spam_injection",
            severity="med",
            response_override=(
                "I can’t help with spam or attempts to override system rules. "
                "If you meant something else, tell me what you're trying to accomplish and I’ll help safely."
            ),
            meta={"reason": "keyword_match"}
        )

    # 1) self-harm
    hit = _matches(SELF_HARM_PATTERNS, text)
    if hit:
        return GuardrailResult(
            triggered=True,
            category="self_harm",
            severity="high",
            response_override=(
                "I’m really sorry you’re feeling this way — you don’t have to carry this alone. "
                "If you’re in immediate danger or thinking about harming yourself, please call emergency services now. "
                "In the U.S., you can call or text **988** (Suicide & Crisis Lifeline). "
                "If you’re outside the U.S., tell me your country and I’ll help find local options. "
                "If you can, what’s happening right now that brought you to this point?"
            ),
            meta={"pattern": hit}
        )

    # 2) harm to others
    hit = _matches(HARM_OTHERS_PATTERNS, text)
    if hit:
        return GuardrailResult(
            triggered=True,
            category="harm_others",
            severity="high",
            response_override=(
                "I can’t help with harming anyone. If you feel like you might act on these feelings, "
                "please step away from anything that could be used to hurt someone and consider contacting local emergency services. "
                "If you want, tell me what triggered this — we can focus on de-escalating and finding a safer next step."
            ),
            meta={"pattern": hit}
        )

    # 3) minors + sexual content (hard stop)
    hit = _matches(MINOR_SEXUAL_PATTERNS, text)
    if hit:
        return GuardrailResult(
            triggered=True,
            category="sexual_minors",
            severity="high",
            response_override="I can’t help with anything sexual involving minors.",
            meta={"pattern": hit}
        )

    # 4) explicit sexual content (soft boundary)
    hit = _matches(EXPLICIT_SEXUAL_PATTERNS, text)
    if hit:
        return GuardrailResult(
            triggered=True,
            category="sexual_explicit",
            severity="med",
            response_override=(
                "I can’t engage in explicit sexual content. If you want to talk about relationships, feelings, or boundaries, I can help with that."
            ),
            meta={"pattern": hit}
        )

    # 5) illegal instructions
    hit = _matches(ILLEGAL_PATTERNS, text)
    if hit:
        return GuardrailResult(
            triggered=True,
            category="illegal",
            severity="high",
            response_override=(
                "I can’t help with illegal or harmful instructions. If you’re trying to solve a real-world problem, "
                "tell me what you’re actually aiming for and we can find a safe alternative."
            ),
            meta={"pattern": hit}
        )

    # 6) optional toxicity (best effort)
    tox = _hf_toxicity_score(text)
    if tox is not None and tox >= 0.85:
        return GuardrailResult(
            triggered=True,
            category="toxicity",
            severity="med",
            response_override=(
                "I want to keep this respectful and constructive. If you’re upset, I can handle it — "
                "tell me what happened and what you need right now."
            ),
            meta={"toxicity_score": tox, "model": HF_TOXIC_MODEL}
        )

    return GuardrailResult(triggered=False, meta={"toxicity_score": tox, "model": HF_TOXIC_MODEL if tox is not None else None})
"""""""""""""""""""""""""""""