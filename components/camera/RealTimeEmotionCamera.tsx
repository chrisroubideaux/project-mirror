// components/camera/RealTimeEmotionCamera.tsx
// components/camera/RealTimeEmotionCamera.tsx
"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type AuroraState = "idle" | "listening" | "talking";

export interface EmotionPayload {
  emotion: string;
  confidence: number;
  valence: number;
  arousal: number;
  dominance: number;
  [key: string]: any;
}

type Props = {
  onEmotion?: (data: EmotionPayload) => void;
  onStateChange?: (state: AuroraState) => void;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
};

export type RealTimeEmotionCameraHandle = {
  startSession: () => Promise<void>;
  stopSession: () => void;
};

function clamp01(v: any, d = 0.5) {
  const n = Number(v);
  if (Number.isNaN(n)) return d;
  return Math.max(0, Math.min(1, n));
}

const RealTimeEmotionCamera = forwardRef<RealTimeEmotionCameraHandle, Props>(
  function RealTimeEmotionCamera({ onEmotion, onStateChange, audioRef }, ref) {
    // -------------------------------------------------------------
    // REFS / INTERNAL STATE
    // -------------------------------------------------------------
    const videoElRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const emotionIntervalRef = useRef<number | null>(null);

    const conversationActiveRef = useRef(false);
    const isAuroraSpeakingRef = useRef(false);

    const [guestName, setGuestName] = useState("friend");
    const [nameCaptured, setNameCaptured] = useState(false);
    const [hfErrorOnce, setHfErrorOnce] = useState(false);

    // ✅ Last good emotion fallback
    const lastGoodEmotionRef = useRef<EmotionPayload>({
      emotion: "neutral",
      confidence: 0.5,
      valence: 0.5,
      arousal: 0.5,
      dominance: 0.5,
    });

    // ✅ Emotion smoothing
    const smoothBufferRef = useRef<EmotionPayload[]>([]);
    const SMOOTH_WINDOW = 10;

    // -------------------------------------------------------------
    // IMPERATIVE CONTROL (Start/Stop from parent)
    // -------------------------------------------------------------
    useImperativeHandle(ref, () => ({
      startSession: async () => {
        await startCameraAndBoot();
      },
      stopSession: () => {
        stopAll();
      },
    }));

    useEffect(() => {
      return () => stopAll();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // -------------------------------------------------------------
    // AUDIO UNLOCK (for autoplay policies)
    // -------------------------------------------------------------
    const unlockAudio = () => {
      try {
        const a = new Audio();
        a.muted = true;
        a.play().catch(() => {});
      } catch {}
    };

    // -------------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------------
    const stopEmotionPolling = () => {
      if (emotionIntervalRef.current) {
        window.clearInterval(emotionIntervalRef.current);
        emotionIntervalRef.current = null;
      }
    };

    const startEmotionPolling = () => {
      stopEmotionPolling();
      emotionIntervalRef.current = window.setInterval(() => {
        if (!isAuroraSpeakingRef.current) captureFrame();
      }, 1500);
    };

    const smoothEmotion = (data: EmotionPayload): EmotionPayload => {
      const entry: EmotionPayload = {
        emotion: data.emotion ?? "neutral",
        confidence: clamp01(data.confidence, 0.5),
        valence: clamp01(data.valence, 0.5),
        arousal: clamp01(data.arousal, 0.5),
        dominance: clamp01(data.dominance, 0.5),
      };

      smoothBufferRef.current.push(entry);
      if (smoothBufferRef.current.length > SMOOTH_WINDOW) {
        smoothBufferRef.current.shift();
      }

      const buf = smoothBufferRef.current;
      const avg = (k: "valence" | "arousal" | "dominance" | "confidence") =>
        buf.reduce((a, b) => a + (b[k] ?? 0), 0) / buf.length;

      const counts: Record<string, number> = {};
      for (const e of buf) counts[e.emotion] = (counts[e.emotion] || 0) + 1;
      const dominant =
        Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";

      return {
        emotion: dominant,
        confidence: avg("confidence"),
        valence: avg("valence"),
        arousal: avg("arousal"),
        dominance: avg("dominance"),
      };
    };

    // -------------------------------------------------------------
    // ✅ ENSURE SINGLE SHARED AUDIO ELEMENT (DO NOT REPLACE)
    // -------------------------------------------------------------
    const ensureSharedAudio = () => {
      if (!audioRef.current) {
        const a = new Audio();
        a.crossOrigin = "anonymous";
        a.preload = "auto";
        audioRef.current = a;
      }
      return audioRef.current;
    };

    const stopAll = () => {
      stopEmotionPolling();
      conversationActiveRef.current = false;

      // stop camera
      const s = streamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      // stop audio (DO NOT NULL OUT THE ELEMENT)
      const a = audioRef.current;
      if (a) {
        a.pause();

        // revoke old blob url to avoid leaks
        const prevSrc = a.src;
        if (prevSrc && prevSrc.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(prevSrc);
          } catch {}
        }

        a.src = "";
        a.onended = null;
        a.onplay = null;
      }

      isAuroraSpeakingRef.current = false;
      onStateChange?.("idle");
    };

    // -------------------------------------------------------------
    // START SESSION: hidden camera + greet + name capture + loop
    // -------------------------------------------------------------
    const startCameraAndBoot = async () => {
      try {
        unlockAudio();
        ensureSharedAudio();

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        streamRef.current = stream;

        const hiddenVideo = document.createElement("video");
        hiddenVideo.autoplay = true;
        hiddenVideo.muted = true;
        hiddenVideo.playsInline = true;
        hiddenVideo.srcObject = stream;

        videoElRef.current = hiddenVideo;

        await new Promise<void>((resolve) => {
          hiddenVideo.onloadedmetadata = () => resolve();
        });

        await hiddenVideo.play().catch(() => {});

        await playGreeting();
        window.setTimeout(() => startNameCapture(), 600);
      } catch (err) {
        console.error("Session start error:", err);
        stopAll();
        alert("Camera access blocked or unavailable.");
      }
    };

    // -------------------------------------------------------------
    // CAPTURE FRAME → EMOTION
    // -------------------------------------------------------------
    const captureFrame = async () => {
      const video = videoElRef.current;
      if (!video) return;

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      if (!w || !h) return;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, w, h);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92)
      );
      if (!blob) return;

      const fd = new FormData();
      fd.append("image", blob, "frame.jpg");

      try {
        const res = await fetch("http://localhost:5000/api/emotion/analyze", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          if (!hfErrorOnce) {
            console.error("Emotion analyze error:", await res.text());
            setHfErrorOnce(true);
          }
          return;
        }

        const raw = (await res.json()) as EmotionPayload;
        if (!raw?.emotion) return;

        lastGoodEmotionRef.current = raw;

        const smooth = smoothEmotion(raw);
        onEmotion?.(smooth);
      } catch (err) {
        if (!hfErrorOnce) {
          console.error("Emotion fetch error:", err);
          setHfErrorOnce(true);
        }
        onEmotion?.(lastGoodEmotionRef.current);
      }
    };

    // -------------------------------------------------------------
    // ✅ AUDIO PLAY (REUSE SHARED ELEMENT ALWAYS)
    // -------------------------------------------------------------
    const playAudioBlob = async (blob: Blob) => {
      const a = ensureSharedAudio();

      // stop any previous playback (DO NOT NULL)
      a.pause();

      // revoke previous blob url (if any)
      const prevSrc = a.src;
      if (prevSrc && prevSrc.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(prevSrc);
        } catch {}
      }

      const url = URL.createObjectURL(blob);
      a.src = url;
      a.currentTime = 0;

      isAuroraSpeakingRef.current = true;
      onStateChange?.("talking");

      a.onended = () => {
        isAuroraSpeakingRef.current = false;
        onStateChange?.("idle");
      };

      // wait until the element can play (helps analyzers + reliability)
      if (a.readyState < 2) {
        await new Promise<void>((resolve) => {
          const done = () => resolve();
          a.addEventListener("loadeddata", done, { once: true });
          a.addEventListener("canplay", done, { once: true });
        });
      }

      await a.play();
    };

    // -------------------------------------------------------------
    // GREETING
    // -------------------------------------------------------------
    const playGreeting = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/aurora/greet");
        if (!res.ok) return;

        const blob = await res.blob();
        await playAudioBlob(blob);
      } catch (err) {
        console.error("Greeting error:", err);
      }
    };

    // -------------------------------------------------------------
    // NAME CAPTURE (Whisper)
    // -------------------------------------------------------------
    const startNameCapture = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        let chunks: Blob[] = [];
        const rec = new MediaRecorder(stream);

        rec.onstart = () => onStateChange?.("listening");
        rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);

        rec.onstop = async () => {
          onStateChange?.("idle");

          const blob = new Blob(chunks, { type: "audio/webm" });

          try {
            const fd = new FormData();
            fd.append("audio", blob, "name.webm");

            const res = await fetch(
              "http://localhost:5000/api/whisper/transcribe",
              { method: "POST", body: fd }
            );

            const data = await res.json();
            let first = (data.text || "")
              .replace(/^(my name is|i am|i'm|it's)/i, "")
              .replace(/[^a-zA-Z]/g, "")
              .trim()
              .toLowerCase();

            if (!first || first.length < 2) first = "friend";

            setGuestName(first);
            setNameCaptured(true);
          } finally {
            stream.getTracks().forEach((t) => t.stop());
          }

          startEmotionPolling();
          window.setTimeout(() => startAutoConversationLoop(), 800);
        };

        rec.start();
        window.setTimeout(() => rec.stop(), 2300);
      } catch (err) {
        console.error("Name capture error:", err);
        setGuestName("friend");
        setNameCaptured(true);
        startEmotionPolling();
        window.setTimeout(() => startAutoConversationLoop(), 800);
      }
    };

    // -------------------------------------------------------------
    // AUTO CONVERSATION LOOP
    // -------------------------------------------------------------
    const startAutoConversationLoop = () => {
      if (conversationActiveRef.current) return;
      conversationActiveRef.current = true;
      scheduleNextTurn();
    };

    const scheduleNextTurn = () => {
      if (!conversationActiveRef.current) return;

      if (isAuroraSpeakingRef.current) {
        window.setTimeout(scheduleNextTurn, 500);
        return;
      }

      window.setTimeout(recordVoiceTurn, 700);
    };

    const recordVoiceTurn = async () => {
      if (!conversationActiveRef.current || isAuroraSpeakingRef.current) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        let chunks: Blob[] = [];

        const rec = new MediaRecorder(stream);

        rec.onstart = () => onStateChange?.("listening");
        rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);

        rec.onstop = async () => {
          onStateChange?.("idle");

          const blob = new Blob(chunks, { type: "audio/webm" });

          if (blob.size > 2500) {
            void sendToAurora(blob);
          }

          stream.getTracks().forEach((t) => t.stop());
          scheduleNextTurn();
        };

        rec.start();
        window.setTimeout(() => rec.stop(), 3000);
      } catch (err) {
        console.error("Mic error:", err);
        window.setTimeout(scheduleNextTurn, 1500);
      }
    };

    // -------------------------------------------------------------
    // SEND TO AURORA
    // -------------------------------------------------------------
    const sendToAurora = async (blob: Blob) => {
      if (isAuroraSpeakingRef.current) return;

      stopEmotionPolling();
      isAuroraSpeakingRef.current = true;
      onStateChange?.("talking");

      const fd = new FormData();
      fd.append("audio", blob, "speech.webm");
      fd.append("user_name", (nameCaptured ? guestName : "friend") || "friend");

      const safe = lastGoodEmotionRef.current;
      fd.append("face_emotion", safe.emotion);
      fd.append("valence", String(clamp01(safe.valence)));
      fd.append("arousal", String(clamp01(safe.arousal)));
      fd.append("dominance", String(clamp01(safe.dominance)));

      try {
        const res = await fetch("http://localhost:5000/api/aurora/converse", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          console.error("Aurora error:", await res.text());
          isAuroraSpeakingRef.current = false;
          onStateChange?.("idle");
          startEmotionPolling();
          return;
        }

        const outBlob = await res.blob();
        await playAudioBlob(outBlob);

        const a = audioRef.current;
        if (a) {
          const prev = a.onended;
          a.onended = (ev) => {
            if (prev) prev.call(a, ev as any);
            isAuroraSpeakingRef.current = false;
            onStateChange?.("idle");
            startEmotionPolling();
          };
        } else {
          isAuroraSpeakingRef.current = false;
          onStateChange?.("idle");
          startEmotionPolling();
        }
      } catch (err) {
        console.error("Aurora fetch error:", err);
        isAuroraSpeakingRef.current = false;
        onStateChange?.("idle");
        startEmotionPolling();
      }
    };

    return null;
  }
);

export default RealTimeEmotionCamera;


{/*

// components/camera/RealTimeEmotionCamera.tsx

'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onEmotion?: (data: any) => void;
}

export default function RealTimeEmotionCamera({ onEmotion }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullVideoRef = useRef<HTMLVideoElement>(null);

  // Emotion polling interval
  const intervalRef = useRef<number | null>(null);

  // Voice tracking for auto Aurora responses
  const lastSpokenStateRef = useRef<string | null>(null);
  const lastSpokenAtRef = useRef<number>(0);
  const lastScoreRef = useRef<number | null>(null);

  // Mic recording for push-to-talk
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const [streaming, setStreaming] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [emotionResult, setEmotionResult] = useState<any | null>(null);

  // --------------------------------------------------
  // AUDIO UNLOCK (Browser autoplay requirement)
  // --------------------------------------------------
  const unlockAudio = () => {
    const a = new Audio();
    a.play().catch(() => {
      // Just to unlock; ignore errors
    });
  };

  // --------------------------------------------------
  // CAMERA CONTROL
  // --------------------------------------------------
  const startCamera = async () => {
    try {
      // Unlock audio so future .play() calls are allowed
      unlockAudio();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current) videoRef.current.srcObject = stream;
      if (fullVideoRef.current) fullVideoRef.current.srcObject = stream;

      setStreaming(true);
      startRealtimeLoop();
    } catch (err) {
      console.error('Camera error:', err);
      alert('Cannot access camera');
    }
  };

  const startRealtimeLoop = () => {
    stopRealtimeLoop();
    intervalRef.current = window.setInterval(() => {
      captureFrame();
    }, 1000); // 1 FPS – balance between responsiveness and cost
  };

  const stopRealtimeLoop = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopRealtimeLoop();
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // --------------------------------------------------
  // EMOTION + AUTO AURORA VOICE
  // --------------------------------------------------
  const captureFrame = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg')
    );

    if (!blob) return;

    const formData = new FormData();
    formData.append('image', blob, 'frame.jpg');

    try {
      const res = await fetch('http://localhost:5000/api/emotion/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setEmotionResult(data);
      if (onEmotion) onEmotion(data);

      // Auto Aurora responses (therapist-style pacing)
      await maybeSpeakAurora(data);
    } catch (err) {
      console.error('Real-time emotion error:', err);
    }
  };

  const maybeSpeakAurora = async (data: any) => {
    if (!data) return;

    const state: string | undefined = data.state;
    const valence: number | undefined = data.valence;
    const arousal: number | undefined = data.arousal;
    const dominance: number | undefined = data.dominance;

    const score: number | null =
      typeof data.score === 'number'
        ? data.score
        : typeof data.confidence === 'number'
        ? data.confidence
        : null;

    // Need valid PAD + meaningful state
    if (
      typeof valence !== 'number' ||
      typeof arousal !== 'number' ||
      typeof dominance !== 'number' ||
      !state ||
      state === 'uncertain'
    ) {
      return;
    }

    // Optional: ignore low-confidence updates
    if (score !== null && score < 0.5) {
      return;
    }

    const now = Date.now();
    const COOLDOWN_MS = 15000; // 15 seconds, warm therapist pacing

    // Cooldown gate
    if (now - lastSpokenAtRef.current < COOLDOWN_MS) {
      if (score !== null) {
        lastScoreRef.current = score;
      }
      return;
    }

    const prevState = lastSpokenStateRef.current;
    const prevScore = lastScoreRef.current;

    let shouldSpeak = false;

    // 1) Different emotional state
    if (prevState !== state) {
      shouldSpeak = true;
    }
    // 2) Same state but intensity jumps significantly
    else if (
      score !== null &&
      prevScore !== null &&
      Math.abs(score - prevScore) > 0.25
    ) {
      shouldSpeak = true;
    }
    // 3) First time we ever got a score
    else if (score !== null && prevScore === null) {
      shouldSpeak = true;
    }

    if (score !== null) {
      lastScoreRef.current = score;
    }

    if (!shouldSpeak) return;

    lastSpokenStateRef.current = state;
    lastSpokenAtRef.current = now;

    try {
      const res = await fetch('http://localhost:5000/api/aurora/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valence, arousal, dominance }),
      });

      if (!res.ok) {
        console.error('Aurora speak error:', await res.text());
        return;
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err) {
      console.error('Error playing Aurora voice:', err);
    }
  };

  // --------------------------------------------------
  // 🎤 PUSH-TO-TALK MICROPHONE (Whisper → Aurora)
  // --------------------------------------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm',
          });

          const formData = new FormData();
          formData.append('audio', audioBlob, 'speech.webm');

          const res = await fetch('http://localhost:5000/api/aurora/converse', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            console.error('Aurora converse error:', await res.text());
            return;
          }

          const audioRes = await res.blob();
          const url = URL.createObjectURL(audioRes);
          const audio = new Audio(url);
          audio.play();
        } catch (err) {
          console.error('Error in converse playback:', err);
        } finally {
          // Stop audio tracks so mic is released
          stream.getTracks().forEach((t) => t.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // --------------------------------------------------
  // DERIVED HUD VALUES
  // --------------------------------------------------
  const dominantLabel: string | null =
    emotionResult?.emotion ||
    emotionResult?.dominant_emotion ||
    emotionResult?.label ||
    null;

  const confidenceValue: number | null =
    typeof emotionResult?.confidence === 'number'
      ? emotionResult.confidence
      : typeof emotionResult?.score === 'number'
      ? emotionResult.score
      : null;

  let scores: Record<string, number> | null = null;
  if (emotionResult) {
    scores =
      emotionResult.scores ||
      emotionResult.probabilities ||
      emotionResult.emotions ||
      null;
  }

  const topScores: [string, number][] =
    scores && typeof scores === 'object'
      ? (Object.entries(scores) as [string, number][])
          .filter(([, v]) => typeof v === 'number')
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
      : [];

  const auroraLine: string | null = emotionResult?.aurora_response || null;
  const emotionalState: string | null = emotionResult?.state || null;

  // --------------------------------------------------
  // UI – CINEMATIC MIRROR VIBES
  // --------------------------------------------------
  return (
    <>
    
      <div
        className="card p-4 bg-dark text-light border-0 shadow-lg mx-auto"
        style={{
          width: '100%',
          maxWidth: '720px',
          borderRadius: '22px',
          background: 'rgba(15, 15, 15, 0.65)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 0 35px rgba(0, 140, 255, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >

        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            pointerEvents: 'none',
            background:
              'radial-gradient(circle at 0% 0%, rgba(0,180,255,0.20), transparent 55%), radial-gradient(circle at 100% 100%, rgba(140,60,255,0.22), transparent 55%)',
            mixBlendMode: 'screen',
            opacity: 0.9,
          }}
        />

        <div
          className="position-relative rounded mb-4 overflow-hidden"
          style={{
            height: '400px',
            borderRadius: '18px',
            border: streaming
              ? '2px solid rgba(0, 180, 255, 0.9)'
              : '2px solid rgba(120,120,120,0.4)',
            boxShadow: streaming
              ? '0 0 28px rgba(0, 180, 255, 0.6)'
              : '0 0 14px rgba(0,0,0,0.6)',
            transition: '.4s ease',
            backgroundColor: '#000',
          }}
        >
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              pointerEvents: 'none',
              background:
                'radial-gradient(circle at 10% 0%, rgba(0, 255, 190, 0.18), transparent 55%), radial-gradient(circle at 90% 100%, rgba(130, 50, 255, 0.24), transparent 55%)',
              opacity: streaming ? 1 : 0.3,
              mixBlendMode: 'screen',
              transition: 'opacity .5s ease',
              zIndex: 1,
            }}
          />

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-100 h-100 position-relative"
            style={{
              objectFit: 'cover',
              zIndex: 2,
            }}
          />

          <div
            className="position-absolute top-0 start-0 w-100 h-100 scanlines-overlay"
            style={{
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />

          {streaming && (
            <div
              className="position-absolute"
              style={{
                top: '20%',
                left: '22%',
                width: '56%',
                height: '60%',
                border: '2px solid rgba(0, 220, 255, 0.8)',
                boxShadow: '0 0 18px rgba(0, 220, 255, 0.5)',
                borderRadius: '16px',
                animation: 'faceBoxGlow 2.5s ease-in-out infinite',
                pointerEvents: 'none',
                zIndex: 4,
              }}
            />
          )}

          {streaming && (
            <div
              className="position-absolute top-0 end-0 m-3 px-2 py-1 rounded-pill text-white"
              style={{
                background: 'rgba(255, 0, 0, 0.85)',
                fontSize: '.8rem',
                fontWeight: 700,
                letterSpacing: '1px',
                animation: 'pulseLive 1.5s infinite',
                zIndex: 5,
              }}
            >
              LIVE
            </div>
          )}

          {streaming && (
            <div
              className="position-absolute start-0 bottom-0 m-3 p-3 rounded-3"
              style={{
                minWidth: '220px',
                maxWidth: '260px',
                background: 'rgba(10, 10, 20, 0.86)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.16)',
                boxShadow: '0 0 18px rgba(0, 180, 255, 0.45)',
                animation: 'hudFloat 4s ease-in-out infinite',
                zIndex: 6,
              }}
            >
              <div
                className="text-uppercase mb-1"
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.12em',
                  color: '#9ca3af',
                }}
              >
                Emotion Snapshot
              </div>

              <div className="d-flex align-items-baseline justify-content-between mb-1">
                <div className="fw-semibold" style={{ fontSize: '0.95rem' }}>
                  {dominantLabel || 'Detecting…'}
                </div>
                {confidenceValue !== null && (
                  <div
                    className="text-info"
                    style={{ fontSize: '0.75rem', opacity: 0.9 }}
                  >
                    {(confidenceValue * 100).toFixed(0)}%
                  </div>
                )}
              </div>

              {emotionalState && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    marginBottom: '0.25rem',
                  }}
                >
                  State:{' '}
                  <span className="text-info" style={{ textTransform: 'capitalize' }}>
                    {emotionalState}
                  </span>
                </div>
              )}
              {auroraLine && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#e5e7eb',
                    fontStyle: 'italic',
                  }}
                >
                  “{auroraLine}”
                </div>
              )}

           
              {topScores.length > 0 && (
                <div style={{ fontSize: '0.7rem', marginTop: '0.35rem' }}>
                  {topScores.map(([label, value]) => (
                    <div key={label} className="mb-1">
                      <div
                        className="d-flex justify-content-between"
                        style={{ fontSize: '0.68rem', color: '#d1d5db' }}
                      >
                        <span>{label}</span>
                        <span>{(value * 100).toFixed(0)}%</span>
                      </div>
                      <div
                        className="progress"
                        style={{
                          height: '5px',
                          backgroundColor: 'rgba(55,65,81,0.85)',
                          borderRadius: '999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${Math.min(value * 100, 100)}%`,
                            background:
                              'linear-gradient(90deg, rgba(0,200,255,0.95), rgba(140,60,255,0.95))',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

       
          {streaming && (
            <button
              onClick={() => setShowFullscreen(true)}
              className="btn btn-outline-light position-absolute bottom-0 end-0 m-3 px-3 py-1"
              style={{
                backdropFilter: 'blur(5px)',
                borderRadius: '10px',
                zIndex: 7,
              }}
            >
              ⤢ Full Screen
            </button>
          )}
        </div>

     
        {!streaming ? (
          <button
            className="btn w-100 py-2 fs-5 fw-semibold mb-2"
            style={{
              borderRadius: '14px',
              background:
                'linear-gradient(135deg, rgba(0,140,255,.9), rgba(130,50,255,.9), rgba(0,255,190,.75))',
              backgroundSize: '200% 200%',
              animation: 'auroraGlow 6s ease infinite',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'white',
              boxShadow: '0 0 18px rgba(0,150,255,0.35)',
              backdropFilter: 'blur(6px)',
            }}
            onClick={startCamera}
          >
            Start Emotion Scan
          </button>
        ) : (
          <>
           
            <button
              className="btn w-100 py-2 fs-6 fw-semibold mb-2"
              style={{
                borderRadius: '14px',
                background: isRecording
                  ? 'linear-gradient(135deg, rgba(255,60,60,0.9), rgba(200,30,30,0.9))'
                  : 'linear-gradient(135deg, rgba(0,160,255,0.95), rgba(140,60,255,0.95))',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: isRecording
                  ? '0 0 18px rgba(255,80,80,0.55)'
                  : '0 0 18px rgba(0,160,255,0.55)',
              }}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? '🛑 Stop Talking' : '🎤 Talk to Aurora'}
            </button>

          
            <button
              className="btn w-100 py-2 fs-5 fw-semibold"
              style={{
                borderRadius: '14px',
                background:
                  'linear-gradient(135deg, rgba(40,40,40,0.85), rgba(60,60,60,0.7))',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 0 15px rgba(130,90,255,0.25)',
                backdropFilter: 'blur(6px)',
              }}
              onClick={() => window.location.reload()}
            >
              Stop Session
            </button>
          </>
        )}
      </div>

     
      {showFullscreen && (
        <div
          className="modal fade show"
          style={{ display: 'block', background: 'rgba(0,0,0,0.85)' }}
        >
          <div className="modal-dialog modal-fullscreen">
            <div className="modal-content bg-dark position-relative">
              <div className="position-relative w-100 h-100">
              
                <video
                  ref={fullVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-100 h-100 position-absolute top-0 start-0"
                  style={{
                    objectFit: 'cover',
                    filter: 'brightness(1.1)',
                    zIndex: 1,
                  }}
                />

              
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 scanlines-overlay"
                  style={{ pointerEvents: 'none', zIndex: 2 }}
                />
                <div
                  className="position-absolute top-0 start-0 w-100 h-100"
                  style={{
                    pointerEvents: 'none',
                    background:
                      'radial-gradient(circle at 0% 0%, rgba(0,180,255,0.18), transparent 55%), radial-gradient(circle at 100% 100%, rgba(140,60,255,0.20), transparent 55%)',
                    mixBlendMode: 'screen',
                    opacity: 0.8,
                    zIndex: 2,
                  }}
                />

              
                {dominantLabel && (
                  <div
                    className="position-absolute start-0 top-0 m-4 px-3 py-2 rounded-3 text-white"
                    style={{
                      background: 'rgba(0,0,0,0.55)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      backdropFilter: 'blur(8px)',
                      fontSize: '0.9rem',
                      zIndex: 3,
                    }}
                  >
                    Emotion: <strong>{dominantLabel}</strong>
                    {confidenceValue !== null && (
                      <span className="ms-2 text-info">
                        {(confidenceValue * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                className="btn btn-light position-absolute top-0 end-0 m-4 px-4 py-2 fs-5"
                style={{ borderRadius: '12px', zIndex: 4 }}
                onClick={() => setShowFullscreen(false)}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}


      <style>
        {`
        @keyframes pulseLive {
          0% { transform: scale(1); opacity: .9; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: .9; }
        }

        @keyframes auroraGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes scanLines {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }

        .scanlines-overlay {
          background-image: repeating-linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.045) 0px,
            rgba(255, 255, 255, 0.045) 1px,
            transparent 2px,
            transparent 4px
          );
          mix-blend-mode: soft-light;
          animation: scanLines 6s linear infinite;
        }

        @keyframes faceBoxGlow {
          0% { box-shadow: 0 0 12px rgba(0, 220, 255, 0.3); }
          50% { box-shadow: 0 0 22px rgba(0, 220, 255, 0.7); }
          100% { box-shadow: 0 0 12px rgba(0, 220, 255, 0.3); }
        }

        @keyframes hudFloat {
          0% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
          100% { transform: translateY(0); }
        }
        `}
      </style>
    </>
  );
}




*/}