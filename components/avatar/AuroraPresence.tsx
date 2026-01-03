// components/avatar/AuroraPresence.tsx
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

  // 🔥 individual micro motion
  angle: number;
  radius: number;
  speed: number;
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

  // live refs
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
  // INIT
  // -----------------------------
  const init = (w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;

    particlesRef.current = Array.from({ length: 1400 }).map(() => {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 160;

      return {
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
        vx: 0,
        vy: 0,
        r: 0.7 + Math.random() * 0.8,

        angle: Math.random() * Math.PI * 2,
        radius: 2 + Math.random() * 6,
        speed: 0.001 + Math.random() * 0.002,
      };
    });
  };

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
      const cx = w / 2;
      const cy = h / 2;

      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(0, 0, w, h);

      // -----------------------------
      // AUDIO ENERGY
      // -----------------------------
      let raw = 0;
      if (analyserRef.current && dataRef.current) {
        analyserRef.current.getByteFrequencyData(dataRef.current);
        let sum = 0;
        for (let i = 0; i < dataRef.current.length; i++) sum += dataRef.current[i];
        raw = sum / dataRef.current.length / 255;
      }

      const prev = smoothedEnergyRef.current;
      smoothedEnergyRef.current =
        raw > prev
          ? prev + (raw - prev) * 0.22
          : prev + (raw - prev) * 0.08;

      const voiceEnergy = smoothedEnergyRef.current;

      // -----------------------------
      // GLOBAL HIVE MOTION
      // -----------------------------
      const time = performance.now();

      // 🫁 breathing
      const breathe =
        stateRef.current === "idle"
          ? Math.sin(time * 0.0006) * 12
          : 0;

      // 🌀 slow rotation
      const rotation =
        time * (0.00004 + voiceEnergy * 0.00025);

      // 🎭 emotion deformation
      const valence = emotionRef.current?.valence ?? 0.5;
      const arousal = emotionRef.current?.arousal ?? 0.5;

      const stretchX = 1 + (valence - 0.5) * 0.25;
      const stretchY = 1 + (arousal - 0.5) * 0.35;

      // -----------------------------
      // PARTICLES
      // -----------------------------
      for (const p of particlesRef.current) {
        // individual micro motion
        p.angle += p.speed;
        const mx = Math.cos(p.angle) * p.radius;
        const my = Math.sin(p.angle) * p.radius;

        // vector from center
        const dx = p.x - cx;
        const dy = p.y - cy;

        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const baseRadius = 140 + breathe + voiceEnergy * 220;

        // cohesion toward volumetric mass
        const targetRadius = baseRadius * (dist / baseRadius);
        const pull = (targetRadius - dist) * 0.0012;

        // rotation
        const rx =
          dx * Math.cos(rotation) - dy * Math.sin(rotation);
        const ry =
          dx * Math.sin(rotation) + dy * Math.cos(rotation);

        // apply forces
        p.vx += (rx / dist) * pull;
        p.vy += (ry / dist) * pull;

        // voice expansion
        p.vx += (dx / dist) * voiceEnergy * 0.6;
        p.vy += (dy / dist) * voiceEnergy * 0.6;

        // integrate
        p.x += p.vx + mx * 0.02;
        p.y += p.vy + my * 0.02;

        p.vx *= 0.96;
        p.vy *= 0.96;

        // draw
        ctx.beginPath();
        ctx.arc(
          cx + (p.x - cx) * stretchX,
          cy + (p.y - cy) * stretchY,
          p.r,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(160,220,255,${
          0.07 + voiceEnergy * 0.45
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