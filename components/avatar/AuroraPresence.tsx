// components/avatar/AuroraPresence.tsx
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
  pbest: number;
  seed: number;
};

const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

// smooth noise
function hash1(n: number) {
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}
function noise1(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  return lerp(hash1(i), hash1(i + 1), smoothstep(f));
}

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

  // audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);

  const envFast = useRef(0);
  const envSlow = useRef(0);
  const envSmooth = useRef(0);

  // motion
  const rotation = useRef(0);
  const time = useRef(0);

  // state transitions
  const prevState = useRef<AuroraState>("idle");
  const talkStart = useRef(0);

  // ---------------- INIT ----------------
  const initParticles = (count: number) => {
    particlesRef.current = Array.from({ length: count }).map(() => {
      const r = Math.sqrt(Math.random());
      return {
        angle: Math.random() * Math.PI * 2,
        radius: r,
        vel: 0,
        pbest: r,
        seed: Math.random() * 999,
      };
    });
  };

  const ensureAudio = () => {
    if (!audio || audio.readyState < 2) return;
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();

    if (!analyserRef.current) {
      const a = audioCtxRef.current.createAnalyser();
      a.fftSize = 1024;
      a.smoothingTimeConstant = 0.85;
      analyserRef.current = a;
      dataRef.current = new Uint8Array(a.fftSize);
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

  useEffect(() => {
    if (!audio) return;
    const kick = () => {
      envFast.current = 0;
      envSlow.current = 0;
      envSmooth.current = 0;
      ensureAudio();
    };
    audio.addEventListener("play", kick);
    return () => audio.removeEventListener("play", kick);
  }, [audio]);

  // ---------------- MAIN LOOP ----------------
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

      time.current += 1 / 60;

      if (prevState.current !== state) {
        if (state === "talking") talkStart.current = performance.now();
        prevState.current = state;
      }

      // -------- AUDIO --------
      let rms = 0;
      if (state === "talking" && audio) {
        ensureAudio();
        if (analyserRef.current && dataRef.current) {
          analyserRef.current.getByteTimeDomainData(dataRef.current);
          let sum = 0;
          for (let i = 0; i < dataRef.current.length; i++) {
            const v = (dataRef.current[i] - 128) / 128;
            sum += v * v;
          }
          rms = Math.sqrt(sum / dataRef.current.length);
        }
      }

      envFast.current += (rms - envFast.current) * 0.35;
      envSlow.current += (rms - envSlow.current) * 0.06;
      envSmooth.current += (rms - envSmooth.current) * 0.045;

      const energy = envSmooth.current;
      const syllable = clamp(
        (envFast.current - envSlow.current) * 10,
        0,
        1
      );

      const arousal = emotion?.arousal ?? 0.5;
      const valence = emotion?.valence ?? 0.5;
      const dominance = emotion?.dominance ?? 0.5;

      // hesitation
      const hes = smoothstep(
        state === "talking"
          ? clamp((performance.now() - talkStart.current) / 260, 0, 1)
          : 0
      );

      // -------- BACKGROUND --------
      const hueBase = 190 + valence * 60;
      const breathe = Math.sin(time.current * 0.4) * 8;
      const hue = hueBase + breathe;

      const bg = ctx.createRadialGradient(
        cx,
        cy,
        Math.min(w, h) * 0.2,
        cx,
        cy,
        Math.max(w, h)
      );
      bg.addColorStop(0, `hsla(${hue},70%,55%,0.25)`);
      bg.addColorStop(0.5, `hsla(${hue - 30},55%,30%,0.35)`);
      bg.addColorStop(1, `hsla(${hue - 60},40%,10%,0.45)`);

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // -------- THINKING PAUSE GLOW --------
      if (state !== "talking" && energy < 0.05) {
        const glowR = Math.min(w, h) * (0.18 + energy * 0.4);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
        g.addColorStop(0, `hsla(${hue + 20},80%,70%,0.18)`);
        g.addColorStop(1, `hsla(${hue + 20},80%,70%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // -------- MOTION BIASES (emotion-specific) --------
      rotation.current +=
        (state === "talking" ? 0.0012 : 0.0005) *
        (0.8 + dominance * 0.6);

      const baseR = Math.min(w, h) * 0.32;

      const inwardPull =
        state === "talking" ? 0 : -0.08 * (1 - energy);

      const gBest =
        1 +
        energy * (0.8 + arousal * 0.6) +
        syllable * 0.4 +
        inwardPull;

      const omega =
        state === "talking"
          ? lerp(0.975, 0.955, hes)
          : 0.99;

      const c1 = 0.035;
      const c2 =
        state === "talking"
          ? lerp(0.015, 0.055, hes) * (0.8 + dominance * 0.6)
          : 0.015;

      const turbAmp =
        0.006 * (0.25 + arousal * 1.2);

      const breath = Math.sin(time.current * 1.2) * 0.018;

      // -------- PARTICLES --------
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      for (const p of particlesRef.current) {
        const n = noise1(p.seed + p.angle * 3 + time.current * 0.55);
        const turb = (n - 0.5) * turbAmp;

        p.angle +=
          0.00012 +
          (energy + syllable) *
            (0.0004 + dominance * 0.0003) *
            hes;

        p.vel =
          omega * p.vel +
          c1 * Math.random() * (p.pbest - p.radius) +
          c2 * Math.random() * (gBest - p.radius);

        p.radius += p.vel;
        p.radius = clamp(p.radius, 0.05, 1.75);
        p.pbest += (p.radius - p.pbest) * 0.0015;

        const a = p.angle + rotation.current;
        const r = baseR * (p.radius + breath + turb);

        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;

        // color split
        const particleHue =
          hue +
          (valence - 0.5) * 40 +
          (p.seed % 1) * 14;

        const alpha = clamp(
          0.22 + valence * 0.25 + syllable * 0.12,
          0.15,
          0.65
        );

        // bloom
        ctx.beginPath();
        ctx.arc(x, y, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particleHue},85%,65%,${alpha * 0.12})`;
        ctx.fill();

        // core
        ctx.beginPath();
        ctx.arc(x, y, 1.1, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particleHue},75%,60%,${alpha})`;
        ctx.fill();
      }

      ctx.restore();
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
import type { AuroraState, EmotionPayload } from "@/components/camera/RealTimeEmotionCamera";

type Particle = {
  angle: number;
  radius: number;
  vel: number;
  pbest: number;
  seed: number;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

// Lightweight smooth noise (Perlin-ish value noise)
function hash1(n: number) {
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}
function noise1(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash1(i);
  const b = hash1(i + 1);
  return lerp(a, b, smoothstep(f));
}

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

  // Envelopes for syllable pulses
  const envSlowRef = useRef(0);
  const envFastRef = useRef(0);
  const envSmoothedRef = useRef(0);

  // ---- motion ----
  const rotationRef = useRef(0);
  const tRef = useRef(0);

  // ---- talking hesitation ----
  const prevStateRef = useRef<AuroraState>("idle");
  const talkStartRef = useRef<number>(0);

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
        seed: Math.random() * 1000,
      };
    });
  };

  // ---------------------------------------------
  // AUDIO PIPELINE
  // ---------------------------------------------
  const ensureAudioPipeline = () => {
    if (!audio || audio.readyState < 2) return;

    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();

    if (!analyserRef.current) {
      const an = audioCtxRef.current.createAnalyser();
      an.fftSize = 1024;
      an.smoothingTimeConstant = 0.85;
      analyserRef.current = an;
      dataRef.current = new Uint8Array(an.fftSize);
    }

    if (!sourceRef.current) {
      sourceRef.current = audioCtxRef.current.createMediaElementSource(audio);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  // Re-arm on every utterance
  useEffect(() => {
    if (!audio) return;

    const onPlay = () => {
      // reset envelopes so each reply "kicks" again
      envSlowRef.current = 0;
      envFastRef.current = 0;
      envSmoothedRef.current = 0;
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
  // MAIN LOOP (PSO + syllables + hesitation + field + perlin breath)
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

      // time
      tRef.current += 1 / 60;

      // detect state transition for "thinking hesitation"
      if (prevStateRef.current !== state) {
        if (state === "talking") {
          talkStartRef.current = performance.now();
        }
        prevStateRef.current = state;
      }

      // paint fade
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, w, h);

      // rotation (subtle)
      rotationRef.current += state === "talking" ? 0.0015 : 0.0006;

      // ---------- AUDIO ENVELOPES ----------
      let rawRms = 0;

      if (state === "talking" && audio) {
        ensureAudioPipeline();
        if (analyserRef.current && dataRef.current) {
          analyserRef.current.getByteTimeDomainData(dataRef.current);

          let sum = 0;
          for (let i = 0; i < dataRef.current.length; i++) {
            const v = (dataRef.current[i] - 128) / 128;
            sum += v * v;
          }
          rawRms = Math.sqrt(sum / dataRef.current.length);
        }
      }

      // Two envelopes -> syllable detector (fast - slow)
      // fast follows syllables, slow is baseline
      envFastRef.current += (rawRms - envFastRef.current) * 0.35;
      envSlowRef.current += (rawRms - envSlowRef.current) * 0.06;

      // smooth main energy (fluid)
      envSmoothedRef.current += (rawRms - envSmoothedRef.current) * 0.08;

      const audioEnergy = envSmoothedRef.current;

      // syllable pulse 0..1
      const syllable = clamp((envFastRef.current - envSlowRef.current) * 10, 0, 1);

      // ---------- EMOTION ----------
      const arousal = emotion?.arousal ?? 0.5;
      const valence = emotion?.valence ?? 0.5;

      // ---------- "Thinking hesitation" ramp ----------
      // First ~250ms of talking ramps the swarm influence in (feels like intention forming)
      const hesMs = 260;
      const dt = performance.now() - talkStartRef.current;
      const hesitationRamp = state === "talking" ? clamp(dt / hesMs, 0, 1) : 0;
      const hes = smoothstep(hesitationRamp);

      // ---------- Perlin-ish breath turbulence ----------
      // Gentle base breath + turbulence that scales with arousal
      const baseBreath = Math.sin(tRef.current * 1.2) * 0.018; // slow inhale/exhale
      const turbAmp = 0.012 * (0.35 + arousal); // arousal -> more shimmer

      // ---------- GLOBAL BEST ----------
      // gBest is the swarm "intention"
      const gBase = 1 + audioEnergy * 0.85 + arousal * 0.28;
      const gPulse = syllable * 0.45; // temporary shifts on syllables
      const gBest = gBase + gPulse * hes; // syllables only kick when talking has "formed"

      // ---------- PSO COEFFS ----------
      // Make social pull ramp in with hesitation so it feels like she "gathers thoughts"
      const omega = state === "talking" ? lerp(0.94, 0.90, hes) : 0.95; // inertia
      const c1 = 0.04; // memory
      const c2 = state === "talking" ? lerp(0.02, 0.095, hes) : 0.03; // cohesion ramps in

      // ---------- Field distortion visualization ----------
      const baseRadiusPx = Math.min(w, h) * 0.32;
      const fieldR = baseRadiusPx * gBest;

      // draw faint field ring + gradient (subtle)
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const alphaField = 0.06 + 0.10 * hes + 0.10 * syllable;
      const grad = ctx.createRadialGradient(cx, cy, fieldR * 0.55, cx, cy, fieldR * 1.15);
      grad.addColorStop(0, `rgba(120,210,255,0)`);
      grad.addColorStop(0.7, `rgba(120,210,255,${alphaField})`);
      grad.addColorStop(1, `rgba(120,210,255,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, fieldR * 1.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `rgba(140,220,255,${0.10 + 0.18 * syllable})`;
      ctx.beginPath();
      ctx.arc(cx, cy, fieldR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ---------- PARTICLES ----------
      for (const p of particlesRef.current) {
        // per-particle turbulence using smooth noise
        const n = noise1(p.seed + p.angle * 3 + tRef.current * 0.55);
        const turbulence = (n - 0.5) * turbAmp;

        // breath blends with turbulence
        const breath = baseBreath + turbulence;

        // subtle angular drift increases on syllables (adds “life”)
        p.angle += 0.00012 + (audioEnergy * 0.00045 + syllable * 0.00055) * hes;

        // PSO update
        const r1 = Math.random();
        const r2 = Math.random();

        p.vel =
          omega * p.vel +
          c1 * r1 * (p.pbest - p.radius) +
          c2 * r2 * (gBest - p.radius);

        p.radius += p.vel;

        // constrain a bit so swarm doesn’t blow out
        p.radius = clamp(p.radius, 0.05, 1.75);

        // update memory VERY slowly (keeps character)
        p.pbest += (p.radius - p.pbest) * 0.0016;

        // position
        const a = p.angle + rotationRef.current;
        const r = baseRadiusPx * (p.radius + breath);

        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;

        // alpha follows valence + subtle syllable sparkle
        const alpha = clamp(0.20 + valence * 0.25 + syllable * 0.12, 0.12, 0.60);

        ctx.beginPath();
        ctx.arc(x, y, 1.08, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140,220,255,${alpha})`;
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



*/}