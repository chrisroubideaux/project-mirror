// components/profile/aurora/UserAurora.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
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

type AnySpeechRecognition = any;

const TOKEN_KEY = "aurora_user_token";
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const MIN_TRANSCRIPT_LEN = 4;

function getSpeechCtor(): AnySpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function normalizeSpeechText(text: string) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyEcho(transcript: string, lastAssistantReply: string) {
  const t = normalizeSpeechText(transcript);
  const a = normalizeSpeechText(lastAssistantReply);

  if (!t || !a) return false;
  if (t.length < MIN_TRANSCRIPT_LEN) return true;

  if (t === a) return true;
  if (a.includes(t) && t.length >= 18) return true;
  if (t.includes(a) && a.length >= 18) return true;

  const tWords = new Set(t.split(" "));
  const aWords = new Set(a.split(" "));
  let overlap = 0;

  for (const word of tWords) {
    if (word.length >= 5 && aWords.has(word)) {
      overlap += 1;
    }
  }

  return overlap >= 5;
}

export default function UserAurora({
  userName: _userName,
  onClose,
}: UserAuroraProps) {
  const aurora = useSelector((s: any) => s.aurora) as any;

  const sessionId = aurora.sessionId as string | null;
  const mode = aurora.mode as "idle" | "thinking" | "speaking" | "settling";

  const relationship = aurora.relationship as any | null;
  const personalityEffective = aurora.personalityEffective as any | null;
  const trends = aurora.trends as any | null;

  const baselineTarget = aurora.baselineTarget as PAD;
  const liveTarget = aurora.liveTarget as PAD | null;
  const audioUrl = aurora.audioUrl as string | null;

  const [token, setToken] = useState<string | null>(null);
  const [audioEnergy, setAudioEnergy] = useState(0);
  const [listening, setListening] = useState(false);

  const apiBase = useMemo(() => getApiBase(), []);

  const recRef = useRef<AnySpeechRecognition | null>(null);

  const bootDoneRef = useRef(false);
  const greetDoneRef = useRef(false);
  const closedRef = useRef(false);
  const sendingRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);
  const lastAssistantReplyRef = useRef("");
  const lastAudioEndedAtRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(TOKEN_KEY);
    setToken(stored);
  }, []);

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

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearRestartTimer();
    setListening(false);

    try {
      recRef.current?.stop();
    } catch {}

    recRef.current = null;
  }, [clearRestartTimer]);

  const resetAuroraState = useCallback(() => {
    store.dispatch(auroraActions.setAudioUrl(null));
    store.dispatch(auroraActions.setAudioPlaying(false));
    store.dispatch(auroraActions.setLiveTarget(null));
    store.dispatch(auroraActions.setMode("idle"));
    store.dispatch(auroraActions.setSessionId(null));
    store.dispatch(auroraActions.setError(null));
    lastAssistantReplyRef.current = "";
  }, []);

  const scheduleListeningRestart = useCallback(() => {
    clearRestartTimer();

    restartTimerRef.current = window.setTimeout(() => {
      restartTimerRef.current = null;

      const currentMode = store.getState().aurora.mode as
        | "idle"
        | "thinking"
        | "speaking"
        | "settling";

      if (closedRef.current) return;
      if (sendingRef.current) return;
      if (recRef.current) return;
      if (audioUrl) return;
      if (currentMode !== "idle") return;

      const msSinceAudioEnd = Date.now() - lastAudioEndedAtRef.current;
      if (lastAudioEndedAtRef.current && msSinceAudioEnd < 350) {
        scheduleListeningRestart();
        return;
      }

      startListening();
    }, 350);
  }, [audioUrl, clearRestartTimer]);

  const handleClose = useCallback(async () => {
    if (closedRef.current) return;
    closedRef.current = true;

    stopListening();

    if (token && sessionId) {
      try {
        await apiJson(`${apiBase}/api/user/aurora/end-session`, {
          method: "POST",
          token,
          body: { session_id: sessionId },
        });
      } catch (e) {
        console.warn("Aurora end-session failed:", e);
      }
    }

    resetAuroraState();
    onClose();
  }, [apiBase, onClose, resetAuroraState, sessionId, stopListening, token]);

  const bootstrap = useCallback(async () => {
    if (!token) {
      store.dispatch(auroraActions.setError("Missing auth token."));
      return;
    }

    try {
      store.dispatch(auroraActions.setError(null));

      const ps = await apiJson<any>(`${apiBase}/api/user/aurora/personality-state`, {
        method: "GET",
        token,
      });

      console.log("Aurora personality-state:", ps);

      const rel = ps?.relationship ?? null;
      const effective = ps?.personality_effective ?? null;
      const nextTrends = ps?.trends ?? null;

      store.dispatch(
        auroraActions.setRelationship({
          trust: rel?.trust ?? rel?.trust_score ?? 0,
          familiarity: rel?.familiarity ?? rel?.familiarity_score ?? 0,
          interactionCount: rel?.interaction_count ?? 0,
          voiceEnabled: (rel?.ritual_preferences || {}).voice_enabled ?? true,
          prefersConcise: (rel?.flags_json || {}).prefers_concise ?? false,
          safetyFlagTriggered: (rel?.flags_json || {}).safety_flag_triggered ?? false,
        })
      );

      store.dispatch(auroraActions.setPersonalityEffective(effective));
      store.dispatch(auroraActions.setTrends(nextTrends));

      computeAndSetBaseline({
        relationship: rel,
        personalityEffective: effective,
        trends: nextTrends,
      });
    } catch (e: any) {
      console.error("Aurora bootstrap failed:", e);
      store.dispatch(auroraActions.setError(e?.message || "Aurora bootstrap failed."));
      computeAndSetBaseline();
    }
  }, [apiBase, computeAndSetBaseline, token]);

  const triggerGreeting = useCallback(async () => {
    if (!token || greetDoneRef.current) return;
    greetDoneRef.current = true;

    try {
      store.dispatch(auroraActions.setError(null));
      store.dispatch(auroraActions.setMode("thinking"));

      const resp = await apiJson<{
        session_id: string;
        assistant_reply: string;
        audio_url: string | null;
        user_name?: string;
      }>(`${apiBase}/api/user/aurora/greet`, {
        method: "POST",
        token,
      });

      console.log("Aurora greet response:", resp);

      if (resp?.assistant_reply) {
        lastAssistantReplyRef.current = resp.assistant_reply;
      }

      if (resp?.session_id) {
        store.dispatch(auroraActions.setSessionId(resp.session_id));
      }

      store.dispatch(auroraActions.setAudioUrl(resp?.audio_url ?? null));

      if (!resp?.audio_url) {
        store.dispatch(auroraActions.setError("Greeting returned no audio URL."));
        store.dispatch(auroraActions.setMode("idle"));
      }
    } catch (e: any) {
      console.error("Aurora greeting failed:", e);
      store.dispatch(auroraActions.setError(e?.message || "Aurora greeting failed."));
      store.dispatch(auroraActions.setMode("idle"));
    }
  }, [apiBase, token]);

  const sendTextToAurora = useCallback(
    async (text: string) => {
      const cleaned = text.trim();

      if (!token || !cleaned || sendingRef.current) return;
      if (cleaned.length < MIN_TRANSCRIPT_LEN) return;

      if (isLikelyEcho(cleaned, lastAssistantReplyRef.current)) {
        console.warn("Blocked likely Aurora echo transcript:", cleaned);
        scheduleListeningRestart();
        return;
      }

      sendingRef.current = true;
      clearRestartTimer();
      store.dispatch(auroraActions.setError(null));
      store.dispatch(auroraActions.setMode("thinking"));

      try {
        const resp = await apiJson<ConverseResponse>(`${apiBase}/api/user/aurora/converse`, {
          method: "POST",
          token,
          body: {
            message: cleaned,
            session_id: sessionId ?? undefined,
          },
        });

        console.log("Aurora converse response:", resp);

        if (resp?.assistant_reply) {
          lastAssistantReplyRef.current = resp.assistant_reply;
        }

        if (resp?.session_id) {
          store.dispatch(auroraActions.setSessionId(resp.session_id));
        }

        store.dispatch(
          auroraActions.setRelationship({
            trust: resp.relationship?.trust_score ?? relationship?.trust ?? 0,
            familiarity: resp.relationship?.familiarity_score ?? relationship?.familiarity ?? 0,
            interactionCount:
              resp.relationship?.interaction_count ?? relationship?.interactionCount ?? 0,
          })
        );

        const url = resp.audio_url ?? null;
        store.dispatch(auroraActions.setAudioUrl(url));

        if (!url) {
          console.warn("Aurora converse returned no audio_url");
          store.dispatch(auroraActions.setMode("idle"));
          scheduleListeningRestart();
        }

        computeAndSetBaseline({
          relationship: {
            trust_score: resp.relationship?.trust_score ?? relationship?.trust ?? 0,
            familiarity_score:
              resp.relationship?.familiarity_score ?? relationship?.familiarity ?? 0,
          },
        });
      } catch (e: any) {
        console.error("Aurora converse failed:", e);
        store.dispatch(auroraActions.setError(e?.message || "Aurora failed to respond."));
        store.dispatch(auroraActions.setMode("idle"));
        scheduleListeningRestart();
      } finally {
        window.setTimeout(() => {
          sendingRef.current = false;
        }, 150);
      }
    },
    [
      apiBase,
      clearRestartTimer,
      computeAndSetBaseline,
      relationship,
      scheduleListeningRestart,
      sessionId,
      token,
    ]
  );

  const startListening = useCallback(() => {
    if (closedRef.current) return;
    if (mode === "thinking" || mode === "speaking") return;
    if (listening) return;
    if (sendingRef.current) return;
    if (audioUrl) return;
    if (recRef.current) return;

    const msSinceAudioEnd = Date.now() - lastAudioEndedAtRef.current;
    if (lastAudioEndedAtRef.current && msSinceAudioEnd < 350) {
      scheduleListeningRestart();
      return;
    }

    const SpeechCtor = getSpeechCtor();
    if (!SpeechCtor) {
      store.dispatch(
        auroraActions.setError("Speech recognition is not supported in this browser. Try Chrome.")
      );
      return;
    }

    clearRestartTimer();

    const rec = new SpeechCtor();
    recRef.current = rec;

    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    setListening(true);

    rec.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript?.trim?.() || "";

      setListening(false);
      recRef.current = null;

      if (!transcript || transcript.length < MIN_TRANSCRIPT_LEN) {
        scheduleListeningRestart();
        return;
      }

      if (isLikelyEcho(transcript, lastAssistantReplyRef.current)) {
        console.warn("Blocked likely Aurora echo transcript:", transcript);
        scheduleListeningRestart();
        return;
      }

      sendTextToAurora(transcript);
    };

    rec.onerror = (event: any) => {
      const err = event?.error;

      setListening(false);
      recRef.current = null;

      if (err === "aborted" || err === "no-speech") {
        scheduleListeningRestart();
        return;
      }

      console.warn("Aurora speech recognition error:", err, event);

      const fatalErrors = new Set([
        "not-allowed",
        "service-not-allowed",
        "audio-capture",
      ]);

      if (fatalErrors.has(err)) {
        store.dispatch(auroraActions.setError(`Speech recognition error: ${err}`));
        return;
      }

      scheduleListeningRestart();
    };

    rec.onend = () => {
      setListening(false);
      recRef.current = null;

      const currentMode = store.getState().aurora.mode as
        | "idle"
        | "thinking"
        | "speaking"
        | "settling";

      if (
        !closedRef.current &&
        !sendingRef.current &&
        !audioUrl &&
        currentMode === "idle"
      ) {
        scheduleListeningRestart();
      }
    };

    try {
      rec.start();
    } catch (e) {
      console.warn("Aurora speech recognition start failed:", e);
      setListening(false);
      recRef.current = null;
      scheduleListeningRestart();
    }
  }, [
    audioUrl,
    clearRestartTimer,
    listening,
    mode,
    scheduleListeningRestart,
    sendTextToAurora,
  ]);

  useEffect(() => {
    if (!token) return;
    if (bootDoneRef.current) return;

    bootDoneRef.current = true;
    store.dispatch(auroraActions.setError(null));

    bootstrap();

    return () => {
      stopListening();
      clearRestartTimer();
    };
  }, [bootstrap, clearRestartTimer, stopListening, token]);

  useEffect(() => {
    if (!token) return;
    if (!bootDoneRef.current) return;
    if (greetDoneRef.current) return;

    const timer = window.setTimeout(() => {
      triggerGreeting();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [token, triggerGreeting]);

  useEffect(() => {
    if (mode !== "idle") {
      if (mode === "thinking" || mode === "speaking") {
        stopListening();
      }
      return;
    }

    const timer = window.setTimeout(() => {
      if (
        !closedRef.current &&
        !audioUrl &&
        !sendingRef.current &&
        !listening &&
        !recRef.current
      ) {
        startListening();
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [audioUrl, listening, mode, startListening, stopListening]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "black",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <AuroraParticleField
          mode={mode}
          baselineTarget={baselineTarget}
          liveTarget={liveTarget}
          audioEnergy={audioEnergy}
        />
      </div>

      <button
        onClick={handleClose}
        aria-label="Close Aurora"
        title="Close Aurora"
        style={{
          position: "absolute",
          top: 22,
          right: 22,
          zIndex: 20,
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(12px)",
          color: "white",
          fontSize: 22,
          cursor: "pointer",
        }}
      >
        ✕
      </button>

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "grid",
          placeItems: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.88)",
            textShadow: "0 0 30px rgba(0,0,0,0.5)",
            padding: 16,
            borderRadius: 18,
            background: "rgba(0,0,0,0.18)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 600 }}>Aurora</div>
          <div style={{ marginTop: 8, fontSize: 14, opacity: 0.82 }}>
            {mode === "thinking"
              ? "Thinking…"
              : mode === "speaking"
              ? "Speaking…"
              : listening
              ? "Listening…"
              : "Present..."}
          </div>
        </div>
      </div>

      <AuroraAudioController
        audioUrl={audioUrl}
        token={token}
        onStart={() => {
          console.log("Aurora audio start:", audioUrl);
          clearRestartTimer();
          stopListening();
          store.dispatch(auroraActions.setAudioPlaying(true));
          store.dispatch(auroraActions.setMode("speaking"));
          store.dispatch(auroraActions.setError(null));
        }}
        onEnd={() => {
          console.log("Aurora audio end");
          lastAudioEndedAtRef.current = Date.now();
          store.dispatch(auroraActions.setAudioPlaying(false));
          store.dispatch(auroraActions.setAudioUrl(null));
          store.dispatch(auroraActions.setMode("idle"));
          scheduleListeningRestart();
        }}
        onEnergy={(e) => setAudioEnergy(e)}
        onError={(err) => {
          console.error("Aurora audio error:", err, audioUrl);
          lastAudioEndedAtRef.current = Date.now();
          store.dispatch(auroraActions.setError(err));
          store.dispatch(auroraActions.setAudioPlaying(false));
          store.dispatch(auroraActions.setAudioUrl(null));
          store.dispatch(auroraActions.setMode("idle"));
          scheduleListeningRestart();
        }}
      />

      {aurora.lastError && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            zIndex: 25,
            maxWidth: 520,
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(255,120,120,0.24)",
            background: "rgba(35,10,10,0.42)",
            color: "rgba(255,220,220,0.95)",
            backdropFilter: "blur(12px)",
            fontSize: 13,
          }}
        >
          {aurora.lastError}
        </div>
      )}
    </div>
  );
}
{

/*
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

type AnySpeechRecognition = any;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function getSpeechCtor(): AnySpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function firstName(fullName: string) {
  const trimmed = (fullName || "").trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] || "there";
}

export default function UserAurora({ userName, onClose }: UserAuroraProps) {
  const token = useSelector((s: RootState) => (s as any).user?.token) as string | undefined;
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
  const [listening, setListening] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const apiBase = useMemo(() => getApiBase(), []);

  const recRef = useRef<AnySpeechRecognition | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const frameIntervalRef = useRef<number | null>(null);
  const greetingDoneRef = useRef(false);
  const bootDoneRef = useRef(false);
  const closedRef = useRef(false);
  const sendingRef = useRef(false);
  const lastTextPadRef = useRef<PAD | null>(null);

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
    setListening(false);
    try {
      recRef.current?.stop();
    } catch {}
  }, []);

  const stopCamera = useCallback(() => {
    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        (videoRef.current as any).srcObject = null;
      } catch {}
    }

    setCameraReady(false);
  }, []);

  const handleClose = useCallback(async () => {
    if (closedRef.current) return;
    closedRef.current = true;

    stopListening();
    stopCamera();

    if (token && sessionId) {
      try {
        await apiJson(`${apiBase}/api/user/aurora/end-session`, {
          method: "POST",
          token,
          body: { session_id: sessionId },
        });
      } catch {
        // best effort only
      }
    }

    store.dispatch(auroraActions.setAudioUrl(null));
    store.dispatch(auroraActions.setAudioPlaying(false));
    store.dispatch(auroraActions.setLiveTarget(null));
    store.dispatch(auroraActions.setMode("idle"));
    store.dispatch(auroraActions.setSessionId(null));

    onClose();
  }, [apiBase, onClose, sessionId, stopCamera, stopListening, token]);

  const bootstrap = useCallback(async () => {
    if (!token) {
      store.dispatch(auroraActions.setError("Missing auth token."));
      return;
    }

    try {
      store.dispatch(auroraActions.setError(null));

      const rel = await apiJson<any>(`${apiBase}/api/user/aurora/relationship`, {
        method: "GET",
        token,
      });

      store.dispatch(
        auroraActions.setRelationship({
          trust: rel.trust_score ?? 0,
          familiarity: rel.familiarity_score ?? 0,
          interactionCount: rel.interaction_count ?? 0,
          voiceEnabled: (rel.ritual_preferences || {}).voice_enabled ?? true,
          prefersConcise: (rel.flags_json || {}).prefers_concise ?? false,
          safetyFlagTriggered: (rel.flags_json || {}).safety_flag_triggered ?? false,
        })
      );

      const ps = await apiJson<any>(`${apiBase}/api/user/aurora/personality-state`, {
        method: "GET",
        token,
      });

      store.dispatch(auroraActions.setPersonalityEffective(ps.personality_effective ?? null));
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
      store.dispatch(auroraActions.setError(e?.message || "Aurora bootstrap failed."));
      computeAndSetBaseline();
    }
  }, [apiBase, computeAndSetBaseline, token]);

  const sendTextToAurora = useCallback(
    async (text: string) => {
      if (!token || !text.trim() || sendingRef.current) return;

      sendingRef.current = true;
      store.dispatch(auroraActions.setError(null));
      store.dispatch(auroraActions.setMode("thinking"));

      try {
        const resp = await apiJson<ConverseResponse>(`${apiBase}/api/user/aurora/converse`, {
          method: "POST",
          token,
          body: {
            message: text.trim(),
            session_id: sessionId ?? undefined,
          },
        });

        store.dispatch(auroraActions.setSessionId(resp.session_id));

        store.dispatch(
          auroraActions.setRelationship({
            trust: resp.relationship?.trust_score ?? 0,
            familiarity: resp.relationship?.familiarity_score ?? 0,
            interactionCount: resp.relationship?.interaction_count ?? 0,
          })
        );

        const emo = resp.emotion || {};
        const textPad: PAD | null =
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

        lastTextPadRef.current = textPad;
        if (textPad) {
          store.dispatch(auroraActions.setLiveTarget(textPad));
        }

        const url = resp.audio_url ?? null;
        store.dispatch(auroraActions.setAudioUrl(url));

        computeAndSetBaseline({
          relationship: {
            trust_score: resp.relationship?.trust_score ?? relationship?.trust ?? 0,
            familiarity_score: resp.relationship?.familiarity_score ?? relationship?.familiarity ?? 0,
          },
        });

        store.dispatch(auroraActions.setMode(url ? "idle" : "settling"));
      } catch (e: any) {
        store.dispatch(auroraActions.setError(e?.message || "Aurora failed to respond."));
        store.dispatch(auroraActions.setMode("idle"));
      } finally {
        window.setTimeout(() => {
          sendingRef.current = false;
        }, 150);
      }
    },
    [apiBase, computeAndSetBaseline, relationship, sessionId, token]
  );

  const startListening = useCallback(() => {
    if (closedRef.current) return;
    if (mode === "thinking" || mode === "speaking") return;
    if (listening) return;

    const SpeechCtor = getSpeechCtor();
    if (!SpeechCtor) {
      store.dispatch(
        auroraActions.setError("Speech recognition is not supported in this browser. Try Chrome.")
      );
      return;
    }

    const rec = new SpeechCtor();
    recRef.current = rec;

    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;

    setListening(true);

    rec.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript?.trim?.() || "";
      setListening(false);
      if (transcript) {
        sendTextToAurora(transcript);
      }
    };

    rec.onerror = () => {
      setListening(false);
      window.setTimeout(() => {
        if (!closedRef.current && mode !== "speaking" && mode !== "thinking") {
          startListening();
        }
      }, 700);
    };

    rec.onend = () => {
      setListening(false);
      window.setTimeout(() => {
        if (!closedRef.current && mode !== "speaking" && mode !== "thinking") {
          startListening();
        }
      }, 500);
    };

    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }, [listening, mode, sendTextToAurora]);

  const sendCameraFrame = useCallback(async () => {
    if (!token) return;
    if (!videoRef.current || !canvasRef.current) return;
    if (!cameraReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video.videoWidth || !video.videoHeight) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.75)
    );

    if (!blob) return;

    try {
      const form = new FormData();
      form.append("frame", blob, "frame.jpg");

      if (lastTextPadRef.current) {
        form.append("text_valence", String(lastTextPadRef.current.valence));
        form.append("text_arousal", String(lastTextPadRef.current.arousal));
        form.append("text_dominance", String(lastTextPadRef.current.dominance));
      }

      const res = await fetch(`${apiBase}/api/user/aurora/emotion`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (!res.ok) return;

      const data = await res.json();

      if (data?.smoothed_pad) {
        store.dispatch(
          auroraActions.setLiveTarget({
            valence: clamp01(Number(data.smoothed_pad.valence)),
            arousal: clamp01(Number(data.smoothed_pad.arousal)),
            dominance: clamp01(Number(data.smoothed_pad.dominance)),
          })
        );
      }
    } catch {
      // best effort only
    }
  }, [apiBase, cameraReady, token]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraReady(true);

      if (frameIntervalRef.current) {
        window.clearInterval(frameIntervalRef.current);
      }

      frameIntervalRef.current = window.setInterval(() => {
        sendCameraFrame();
      }, 1300);
    } catch (e: any) {
      store.dispatch(
        auroraActions.setError(
          e?.message || "Camera permission denied or unavailable."
        )
      );
    }
  }, [sendCameraFrame]);

  useEffect(() => {
    if (bootDoneRef.current) return;
    bootDoneRef.current = true;

    bootstrap();
    startCamera();

    return () => {
      stopListening();
      stopCamera();
    };
  }, [bootstrap, startCamera, stopCamera, stopListening]);

  useEffect(() => {
    if (!token || greetingDoneRef.current) return;
    greetingDoneRef.current = true;

    const name = firstName(userName);
    sendTextToAurora(
      `Greet ${name} by name, warmly and briefly, then invite them to speak.`
    );
  }, [sendTextToAurora, token, userName]);

  useEffect(() => {
    if (mode === "idle" || mode === "settling") {
      const timer = window.setTimeout(() => {
        if (!closedRef.current) startListening();
      }, 500);
      return () => window.clearTimeout(timer);
    }

    if (mode === "thinking" || mode === "speaking") {
      stopListening();
    }
  }, [mode, startListening, stopListening]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "black",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <AuroraParticleField
          mode={mode}
          baselineTarget={baselineTarget}
          liveTarget={liveTarget}
          audioEnergy={audioEnergy}
        />
      </div>

      <button
        onClick={handleClose}
        aria-label="Close Aurora"
        title="Close Aurora"
        style={{
          position: "absolute",
          top: 22,
          right: 22,
          zIndex: 20,
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(12px)",
          color: "white",
          fontSize: 22,
          cursor: "pointer",
        }}
      >
        ✕
      </button>

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "grid",
          placeItems: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.88)",
            textShadow: "0 0 30px rgba(0,0,0,0.5)",
            padding: 16,
            borderRadius: 18,
            background: "rgba(0,0,0,0.18)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 600 }}>Aurora</div>
          <div style={{ marginTop: 8, fontSize: 14, opacity: 0.82 }}>
            {mode === "thinking"
              ? "Thinking…"
              : mode === "speaking"
              ? "Speaking…"
              : listening
              ? "Listening…"
              : "Present…"}
          </div>
        </div>
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: "none" }}
      />
      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
      />

      <AuroraAudioController
        audioUrl={audioUrl}
        onStart={() => {
          store.dispatch(auroraActions.setAudioPlaying(true));
          store.dispatch(auroraActions.setMode("speaking"));
        }}
        onEnd={() => {
          store.dispatch(auroraActions.setAudioPlaying(false));
          store.dispatch(auroraActions.setMode("settling"));
          window.setTimeout(() => {
            store.dispatch(auroraActions.setMode("idle"));
          }, 650);
        }}
        onEnergy={(e) => setAudioEnergy(e)}
        onError={(err) => store.dispatch(auroraActions.setError(err))}
      />

      {aurora.lastError && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            zIndex: 25,
            maxWidth: 520,
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(255,120,120,0.24)",
            background: "rgba(35,10,10,0.42)",
            color: "rgba(255,220,220,0.95)",
            backdropFilter: "blur(12px)",
            fontSize: 13,
          }}
        >
          {aurora.lastError}
        </div>
      )}
    </div>
  );
}



*/}