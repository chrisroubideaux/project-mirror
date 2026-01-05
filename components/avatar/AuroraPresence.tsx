// components/avatar/AuroraPresence.tsx
"use client";

import { useEffect, useRef } from "react";
import type {
  AuroraState,
  EmotionPayload,
} from "@/components/camera/RealTimeEmotionCamera";

type Particle = {
  angle: number;
  radius: number;
  vel: number;

  // PSO memory
  pbest: number;
};

export default function AuroraPresence({
  state,
  emotion,
  audio,
}: {
  state: AuroraState;
  emotion: EmotionPayload | null;
  audio: HTMLAudioElement | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  // ---- audio ----
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const rmsRef = useRef(0);

  // ---- motion ----
  const rotationRef = useRef(0);
  const breathRef = useRef(0);

  // ---------------------------------------------
  // INIT PARTICLES (WITH MEMORY)
  // ---------------------------------------------
  const initParticles = (count: number) => {
    particlesRef.current = Array.from({ length: count }).map(() => {
      const r = Math.sqrt(Math.random());
      return {
        angle: Math.random() * Math.PI * 2,
        radius: r,
        vel: 0,
        pbest: r,
      };
    });
  };

  // ---------------------------------------------
  // AUDIO PIPELINE
  // ---------------------------------------------
  const ensureAudioPipeline = () => {
    if (!audio || audio.readyState < 2) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }

    if (!analyserRef.current) {
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 1024;
      analyserRef.current.smoothingTimeConstant = 0.9;
      dataRef.current = new Uint8Array(analyserRef.current.fftSize);
    }

    if (!sourceRef.current) {
      sourceRef.current =
        audioCtxRef.current.createMediaElementSource(audio);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  // re-arm on every utterance
  useEffect(() => {
    if (!audio) return;

    const onPlay = () => {
      rmsRef.current = 0;
      ensureAudioPipeline();
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("playing", onPlay);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("playing", onPlay);
    };
  }, [audio]);

  // ---------------------------------------------
  // MAIN LOOP (TRUE PSO)
  // ---------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const w = canvas.parentElement?.clientWidth ?? 800;
      const h = 420;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);
    initParticles(900);

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w / 2;
      const cy = h / 2;

      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, w, h);

      // breathing
      breathRef.current += 0.01;
      const breath = Math.sin(breathRef.current) * 0.02;

      // rotation
      rotationRef.current +=
        state === "talking" ? 0.0016 : 0.0006;

      // ---- AUDIO RMS ----
      let audioEnergy = 0;

      if (state === "talking" && audio) {
        ensureAudioPipeline();
        if (analyserRef.current && dataRef.current) {
          analyserRef.current.getByteTimeDomainData(dataRef.current);

          let sum = 0;
          for (let i = 0; i < dataRef.current.length; i++) {
            const v = (dataRef.current[i] - 128) / 128;
            sum += v * v;
          }

          const rms = Math.sqrt(sum / dataRef.current.length);
          rmsRef.current += (rms - rmsRef.current) * 0.08;
          audioEnergy = rmsRef.current;
        }
      } else {
        rmsRef.current *= 0.94;
        audioEnergy = rmsRef.current;
      }

      // ---------------------------------------------
      // PSO PARAMETERS (TUNED FOR FLUIDITY)
      // ---------------------------------------------
      const omega = 0.92; // inertia
      const c1 = 0.04; // personal memory
      const c2 = 0.08; // swarm cohesion

      const arousal = emotion?.arousal ?? 0.5;

      // GLOBAL BEST = swarm intention
      const baseRadius = Math.min(w, h) * 0.32;
      const gBest =
        1 +
        audioEnergy * 0.9 +
        arousal * 0.35;

      for (const p of particlesRef.current) {
        // random factors
        const r1 = Math.random();
        const r2 = Math.random();

        // PSO velocity update
        p.vel =
          omega * p.vel +
          c1 * r1 * (p.pbest - p.radius) +
          c2 * r2 * (gBest - p.radius);

        p.radius += p.vel;

        // update personal best slowly
        p.pbest += (p.radius - p.pbest) * 0.002;

        // subtle angular drift
        p.angle += 0.00012 + audioEnergy * 0.0005;

        const r = baseRadius * (p.radius + breath);
        const a = p.angle + rotationRef.current;

        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;

        ctx.beginPath();
        ctx.arc(x, y, 1.1, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(140,220,255,0.35)";
        ctx.fill();
      }
    };

    tick();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [state, emotion, audio]);

  return (
    <div className="aurora-presence">
      <canvas ref={canvasRef} className="aurora-canvas" />
    </div>
  );
}


{/*
"use client";

import { useEffect, useRef } from "react";
import type {
  AuroraState,
  EmotionPayload,
} from "@/components/camera/RealTimeEmotionCamera";
import "@/styles/aurora.css";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

export default function AuroraPresence({
  state,
  emotion,
  audio,
}: {
  state: AuroraState;
  emotion: EmotionPayload | null;
  audio: HTMLAudioElement | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  // keep latest values without restarting animation
  const stateRef = useRef<AuroraState>("idle");
  const emotionRef = useRef<EmotionPayload | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    emotionRef.current = emotion;
  }, [emotion]);

  // -----------------------------
  // AUDIO ANALYSER
  // -----------------------------
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  // smoothed envelope (critical for responsiveness)
  const smoothedEnergyRef = useRef(0);

  useEffect(() => {
    if (!audio) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }

    const ctx = audioCtxRef.current;
    ctx.resume().catch(() => {});

    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    source.connect(analyser);
    analyser.connect(ctx.destination);

    analyserRef.current = analyser;
    dataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));

    return () => {
      try {
        source.disconnect();
        analyser.disconnect();
      } catch {}
      analyserRef.current = null;
      dataRef.current = null;
    };
  }, [audio]);

  // -----------------------------
  // PARTICLE INIT
  // -----------------------------
  const init = (w: number, h: number) => {
    particlesRef.current = Array.from({ length: 1200 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.04,
      vy: (Math.random() - 0.5) * 0.04,
      r: 0.7 + Math.random() * 0.9,
    }));
  };

  // -----------------------------
  // FLOW FIELD (SMOOTH MOTION)
  // -----------------------------
  const flow = (x: number, y: number, t: number) => ({
    x: Math.sin(y * 0.0025 + t * 0.0004),
    y: Math.cos(x * 0.0025 + t * 0.0004),
  });

  // -----------------------------
  // MAIN LOOP
  // -----------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const w = canvas.parentElement?.clientWidth ?? 800;
      const h = 420;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init(w, h);
    };

    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // background fade (smooth trails)
      ctx.fillStyle = "rgba(0,0,0,0.14)";
      ctx.fillRect(0, 0, w, h);

      // -----------------------------
      // AUDIO ENERGY (SMOOTHED)
      // -----------------------------
      let rawEnergy = 0;

      if (analyserRef.current && dataRef.current) {
        analyserRef.current.getByteFrequencyData(dataRef.current);

        let sum = 0;
        for (let i = 0; i < dataRef.current.length; i++) {
          sum += dataRef.current[i];
        }

        rawEnergy = sum / dataRef.current.length / 255;
      }

      const prev = smoothedEnergyRef.current;
      const attack = 0.18;
      const decay = 0.06;

      smoothedEnergyRef.current =
        rawEnergy > prev
          ? prev + (rawEnergy - prev) * attack
          : prev + (rawEnergy - prev) * decay;

      const voiceEnergy = smoothedEnergyRef.current;

      // emotion influence
      const valence = emotionRef.current?.valence ?? 0.5;
      const arousal = emotionRef.current?.arousal ?? 0.5;

      // state baseline
      const base =
        stateRef.current === "talking"
          ? 1.0
          : stateRef.current === "listening"
          ? 0.85
          : 0.6;

      const t = performance.now();

      // -----------------------------
      // PARTICLES
      // -----------------------------
      for (const p of particlesRef.current) {
        const f = flow(p.x, p.y, t);

        // ambient flow
        p.vx += f.x * 0.01;
        p.vy += f.y * 0.01;

        // voice pressure
        const push = voiceEnergy * 1.4;
        p.vx += f.x * push;
        p.vy += f.y * push;

        // emotional bias
        p.vx += (valence - 0.5) * 0.002;
        p.vy += (arousal - 0.5) * 0.002;

        p.x += p.vx * base;
        p.y += p.vy * base;

        p.vx *= 0.97;
        p.vy *= 0.97;

        // wrap
        if (p.x < 0) p.x += w;
        if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h;
        if (p.y > h) p.y -= h;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160,220,255,${
          0.08 + voiceEnergy * 0.35
        })`;
        ctx.fill();
      }
    };

    tick();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="aurora-presence">
      <canvas ref={canvasRef} className="aurora-canvas" />
      <div className="aurora-vignette" />
    </div>
  );
}
*/}