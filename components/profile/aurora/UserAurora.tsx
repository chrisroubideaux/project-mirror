// components/profile/aurora/UserAurora.tsx  
// components/profile/aurora/UserAurora.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

import type { RootState } from "@/store/store";
import { store } from "@/store/store";
import { auroraActions } from "@/store/features/auroraSlice";

import AuroraParticleField from "./AuroraParticleField";
import AuroraAudioController from "./AuroraAudioController";

import type { ConverseResponse, PAD } from "./types";
import { deriveBaselinePAD } from "./utils/baselineDerivation";
import { apiJson, getApiBase } from "./hooks/useAuroraApi";

type UserAuroraProps = {
  userName: string;
  onClose: () => void;
};

const mkId = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function firstName(full: string) {
  const s = (full || "").trim();
  if (!s) return "there";
  return s.split(/\s+/)[0] || "there";
}

/**
 * Web Speech API wrapper (Chrome works best).
 * No button UI: auto-start listening.
 */
function createSpeechRecognition(): SpeechRecognition | null {
  const W: any = typeof window !== "undefined" ? window : {};
  const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
  if (!SR) return null;

  const rec: SpeechRecognition = new SR();
  rec.lang = "en-US";
  rec.interimResults = false;
  rec.continuous = false; // we loop manually
  return rec;
}

export default function UserAurora({ userName, onClose }: UserAuroraProps) {
  const token = useSelector((s: RootState) => (s as any).user?.token) as
    | string
    | undefined;

  const aurora = useSelector((s: RootState) => (s as any).aurora) as any;

  const sessionId = aurora.sessionId as string | null;
  const mode = aurora.mode as "idle" | "thinking" | "speaking" | "settling";

  const relationship = aurora.relationship as any | null;
  const personalityEffective = aurora.personalityEffective as any | null;
  const trends = aurora.trends as any | null;

  const baselineTarget = aurora.baselineTarget as PAD;
  const liveTarget = aurora.liveTarget as PAD | null;
  const audioUrl = aurora.audioUrl as string | null;

  const [audioEnergy, setAudioEnergy] = useState(0);
  const apiBase = useMemo(() => getApiBase(), []);
  const endingRef = useRef(false);

  // Voice loop state
  const recRef = useRef<SpeechRecognition | null>(null);
  const listeningRef = useRef(false);
  const bootedRef = useRef(false);
  const greetedRef = useRef(false);

  // Prevent double-sends
  const sendLockRef = useRef(false);

  const computeAndSetBaseline = useCallback(
    (next?: {
      relationship?: any | null;
      personalityEffective?: any | null;
      trends?: any | null;
    }) => {
      const rel = next?.relationship ?? relationship;
      const per = next?.personalityEffective ?? personalityEffective;
      const tr = next?.trends ?? trends;

      const pad = deriveBaselinePAD({
        trustScore: rel?.trust ?? rel?.trust_score ?? 0,
        familiarityScore: rel?.familiarity ?? rel?.familiarity_score ?? 0,
        avgEngagement: tr?.avg_engagement ?? tr?.avgEngagement ?? 0.5,
        adaptiveScore: per?.adaptive_score ?? per?.adaptiveScore ?? 0.1,
      });

      store.dispatch(auroraActions.setBaselineTarget(pad));
    },
    [relationship, personalityEffective, trends]
  );

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    try {
      recRef.current?.abort();
    } catch {}
  }, []);

  const closeAndCleanup = useCallback(async () => {
    // stop mic
    stopListening();

    // end session best-effort
    if (!token || !sessionId || endingRef.current) {
      onClose();
      return;
    }

    endingRef.current = true;
    try {
      await apiJson(`${apiBase}/api/user/aurora/end-session`, {
        method: "POST",
        token,
        body: { session_id: sessionId },
      });
    } catch {
      // ignore
    } finally {
      store.dispatch(auroraActions.setSessionId(null));
      store.dispatch(auroraActions.setLiveTarget(null));
      store.dispatch(auroraActions.setAudioUrl(null));
      store.dispatch(auroraActions.setAudioPlaying(false));
      store.dispatch(auroraActions.setMode("idle"));
      endingRef.current = false;
      onClose();
    }
  }, [apiBase, onClose, sessionId, stopListening, token]);

  // ESC closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAndCleanup();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAndCleanup]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!token) {
        store.dispatch(auroraActions.setError("Missing auth token."));
        return;
      }
      if (!text?.trim()) return;
      if (sendLockRef.current) return;

      sendLockRef.current = true;
      store.dispatch(auroraActions.setError(null));
      store.dispatch(auroraActions.setMode("thinking"));

      try {
        const resp = await apiJson<ConverseResponse>(
          `${apiBase}/api/user/aurora/converse`,
          {
            method: "POST",
            token,
            body: { message: text, session_id: sessionId ?? undefined },
          }
        );

        store.dispatch(auroraActions.setSessionId(resp.session_id));

        // Relationship update
        store.dispatch(
          auroraActions.setRelationship({
            trust: resp.relationship?.trust_score ?? 0,
            familiarity: resp.relationship?.familiarity_score ?? 0,
            interactionCount: resp.relationship?.interaction_count ?? 0,
          })
        );

        // ✅ Emotion detection wiring (PAD from backend)
        const emo = resp.emotion || {};
        const nextLive: PAD | null =
          emo &&
          typeof emo === "object" &&
          emo.valence != null &&
          emo.arousal != null &&
          emo.dominance != null
            ? {
                valence: clamp01(Number(emo.valence)),
                arousal: clamp01(Number(emo.arousal)),
                dominance: clamp01(Number(emo.dominance)),
              }
            : null;

        store.dispatch(auroraActions.setLiveTarget(nextLive));

        // audio from backend
        const url = resp.audio_url ?? null;
        store.dispatch(auroraActions.setAudioUrl(url));

        // baseline recompute
        computeAndSetBaseline({
          relationship: {
            trust_score: resp.relationship?.trust_score ?? relationship?.trust ?? 0,
            familiarity_score:
              resp.relationship?.familiarity_score ?? relationship?.familiarity ?? 0,
          },
        });

        // If no audio, we still “settle” quickly
        store.dispatch(auroraActions.setMode(url ? "idle" : "settling"));
      } catch (e: any) {
        store.dispatch(
          auroraActions.setError(e?.message || "Aurora failed to respond.")
        );
        store.dispatch(auroraActions.setMode("idle"));
      } finally {
        // release after a tick (prevents double fire)
        setTimeout(() => {
          sendLockRef.current = false;
        }, 150);
      }
    },
    [apiBase, computeAndSetBaseline, relationship, sessionId, token]
  );

  const startListeningOnce = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!recRef.current) recRef.current = createSpeechRecognition();
    const rec = recRef.current;

    if (!rec) {
      store.dispatch(
        auroraActions.setError(
          "Speech recognition not supported in this browser (try Chrome)."
        )
      );
      return;
    }

    // Don’t listen while Aurora is speaking/thinking
    if (mode === "speaking" || mode === "thinking") return;
    if (listeningRef.current) return;

    listeningRef.current = true;

    let finalText = "";

    rec.onresult = (ev: SpeechRecognitionEvent) => {
      try {
        const t = ev.results?.[0]?.[0]?.transcript || "";
        finalText = t.trim();
      } catch {}
    };

    rec.onerror = () => {
      listeningRef.current = false;
      // keep loop alive
      setTimeout(() => startListeningOnce(), 600);
    };

    rec.onend = () => {
      listeningRef.current = false;

      // If we got something, send it.
      if (finalText) {
        sendMessage(finalText);
        return;
      }

      // Otherwise keep listening (user paused / silence)
      setTimeout(() => startListeningOnce(), 500);
    };

    try {
      rec.start();
    } catch {
      listeningRef.current = false;
      setTimeout(() => startListeningOnce(), 700);
    }
  }, [mode, sendMessage]);

  // Boot relationship/personality baseline once
  useEffect(() => {
    if (!token) {
      store.dispatch(auroraActions.setError("Missing auth token."));
      return;
    }
    if (bootedRef.current) return;
    bootedRef.current = true;

    let mounted = true;

    (async () => {
      try {
        store.dispatch(auroraActions.setError(null));

        const rel = await apiJson<any>(`${apiBase}/api/user/aurora/relationship`, {
          method: "GET",
          token,
        });
        if (!mounted) return;

        store.dispatch(
          auroraActions.setRelationship({
            trust: rel.trust_score ?? 0,
            familiarity: rel.familiarity_score ?? 0,
            interactionCount: rel.interaction_count ?? 0,
            voiceEnabled: (rel.ritual_preferences || {}).voice_enabled ?? true,
            prefersConcise: (rel.flags_json || {}).prefers_concise ?? false,
            safetyFlagTriggered:
              (rel.flags_json || {}).safety_flag_triggered ?? false,
          })
        );

        const ps = await apiJson<any>(
          `${apiBase}/api/user/aurora/personality-state`,
          { method: "GET", token }
        );
        if (!mounted) return;

        store.dispatch(
          auroraActions.setPersonalityEffective(ps.personality_effective ?? null)
        );
        store.dispatch(auroraActions.setTrends(ps.trends ?? null));

        computeAndSetBaseline({
          relationship: {
            trust_score: rel.trust_score ?? 0,
            familiarity_score: rel.familiarity_score ?? 0,
          },
          personalityEffective: ps.personality_effective ?? null,
          trends: ps.trends ?? null,
        });
      } catch (e: any) {
        store.dispatch(
          auroraActions.setError(e?.message || "Aurora bootstrap failed.")
        );
        computeAndSetBaseline();
      }
    })();

    return () => {
      mounted = false;
    };
  }, [apiBase, computeAndSetBaseline, token]);

  // ✅ Auto-greet once when opened (voice reply from backend)
  useEffect(() => {
    if (!token) return;
    if (greetedRef.current) return;

    greetedRef.current = true;

    const name = firstName(userName);

    // This triggers /converse once so Aurora speaks immediately.
    // You can tune the prompt later to be more “Aurora-like”.
    sendMessage(
      `Greet me by name (“${name}”), briefly, and invite me to speak. Keep it short and warm.`
    );
  }, [sendMessage, token, userName]);

  /**
   * ✅ Voice loop controller:
   * After Aurora finishes speaking -> auto listen.
   */
  useEffect(() => {
    if (!token) return;

    // If Aurora is not speaking/thinking, listen.
    if (mode === "idle" || mode === "settling") {
      const t = setTimeout(() => startListeningOnce(), 450);
      return () => clearTimeout(t);
    }

    // If Aurora is speaking/thinking, ensure mic is off.
    if (mode === "speaking" || mode === "thinking") {
      stopListening();
    }
  }, [mode, startListeningOnce, stopListening, token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      try {
        recRef.current?.abort();
      } catch {}
      recRef.current = null;
    };
  }, [stopListening]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "black",
        overflow: "hidden",
      }}
      aria-label="Aurora Voice Session"
    >
      {/* PARTICLES (pointerEvents none so X is always clickable) */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <AuroraParticleField
          mode={mode}
          baselineTarget={baselineTarget}
          liveTarget={liveTarget}
          audioEnergy={audioEnergy}
        />
      </div>

      {/* TOP BAR */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          right: 14,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: 13,
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(10px)",
          }}
        >
          {mode === "thinking"
            ? "Aurora is thinking…"
            : mode === "speaking"
            ? "Aurora is speaking…"
            : listeningRef.current
            ? "Listening…"
            : "Ready…"}
        </div>

        {/* ✅ CLOSE BUTTON (ALWAYS WORKS) */}
        <button
          onClick={closeAndCleanup}
          aria-label="Close Aurora"
          title="Close"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(0,0,0,0.45)",
            color: "rgba(255,255,255,0.9)",
            fontSize: 18,
            cursor: "pointer",
            backdropFilter: "blur(12px)",
          }}
        >
          ✕
        </button>
      </div>

      {/* AUDIO PLAYBACK / ENERGY */}
      <AuroraAudioController
        audioUrl={audioUrl}
        onStart={() => {
          store.dispatch(auroraActions.setAudioPlaying(true));
          store.dispatch(auroraActions.setMode("speaking"));
        }}
        onEnd={() => {
          store.dispatch(auroraActions.setAudioPlaying(false));
          store.dispatch(auroraActions.setMode("settling"));
          setTimeout(() => store.dispatch(auroraActions.setMode("idle")), 600);
        }}
        onEnergy={(e) => setAudioEnergy(e)}
        onError={(err) => store.dispatch(auroraActions.setError(err))}
      />

      {/* ERROR BADGE */}
      {aurora.lastError && (
        <div
          style={{
            position: "absolute",
            bottom: 14,
            left: 14,
            zIndex: 10,
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(255,120,120,0.25)",
            background: "rgba(30,10,10,0.45)",
            color: "rgba(255,220,220,0.95)",
            backdropFilter: "blur(12px)",
            maxWidth: 560,
            fontSize: 13,
            pointerEvents: "auto",
          }}
        >
          {aurora.lastError}
        </div>
      )}
    </div>
  );
}