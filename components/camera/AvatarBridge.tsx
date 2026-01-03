"use client";

import { useEffect, useRef } from "react";

/**
 * What the backend returns.
 * This is intentionally SIMPLE.
 */
export interface SpeechIntent {
  text: string;
  emotion?: string;
  valence?: number;
  arousal?: number;
  dominance?: number;

  // delivery hints (optional, but powerful)
  pace?: "slow" | "normal" | "fast";
  pause_ms?: number;
}

/**
 * Props
 */
interface Props {
  intent: SpeechIntent | null;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * AvatarBridge
 * - Plays speech via HeyGen LiveAvatar (or fallback)
 * - Guarantees start/end callbacks
 */
export default function AvatarBridge({
  intent,
  onStart = () => {},
  onEnd = () => {},
}: Props) {
  const speakingRef = useRef(false);

  useEffect(() => {
    if (!intent) return;
    if (speakingRef.current) return;

    speakingRef.current = true;
    onStart();

    playHeyGen(intent)
      .catch(() => fallbackTTS(intent.text))
      .finally(() => {
        speakingRef.current = false;
        onEnd();
      });
  }, [intent]);

  return null; // no visible UI here
}

/* --------------------------------------------------
   HEYGEN LIVE AVATAR (TEXT → SPEECH)
-------------------------------------------------- */

async function playHeyGen(intent: SpeechIntent) {
  /**
   * This assumes:
   * - You already created a LiveAvatar session
   * - Session ID is stored server-side or in memory
   *
   * For now, this is a SINGLE CALL pattern
   * (works even before full streaming is wired)
   */

  const res = await fetch("http://localhost:5000/api/aurora/heygen-speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: intent.text,
      emotion: intent.emotion,
      pace: intent.pace,
      pause_ms: intent.pause_ms,
    }),
  });

  if (!res.ok) throw new Error("HeyGen failed");

  // For MVP: audio/mp3 fallback from backend
  const blob = await res.blob();
  await playAudioBlob(blob);
}

/* --------------------------------------------------
   AUDIO FALLBACK (NO AVATAR)
-------------------------------------------------- */

async function fallbackTTS(text: string) {
  const res = await fetch("http://localhost:5000/api/aurora/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const blob = await res.blob();
  await playAudioBlob(blob);
}

/* --------------------------------------------------
   SHARED AUDIO PLAYER
-------------------------------------------------- */

function playAudioBlob(blob: Blob): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(URL.createObjectURL(blob));
    audio.onended = () => resolve();
    audio.play().catch(() => resolve());
  });
}
