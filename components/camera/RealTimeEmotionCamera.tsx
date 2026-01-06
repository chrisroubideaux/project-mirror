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
