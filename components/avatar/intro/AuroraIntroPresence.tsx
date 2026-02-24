// components/avatar/intro/AuroraIntroPresence.tsx
// components/avatar/intro/AuroraIntroPresence.tsx
"use client";

import { useEffect, useRef, useState } from "react";

/* ============================= */
/* TYPES                         */
/* ============================= */

type AuroraState = "loading" | "talking" | "done";

type Particle = {
  angle: number;
  radius: number;
  vel: number;
  pbest: number;
  seed: number;
};

/* ============================= */
/* HELPERS                       */
/* ============================= */

const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

function hash1(n: number) {
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}

function noise1(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  return lerp(hash1(i), hash1(i + 1), smoothstep(f));
}

// ✅ robust base URL (keeps your env var, but safe fallback)
function getApiBase() {
  const env = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (env && env.startsWith("http")) return env;

  // fallback: same machine host
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }

  return "http://localhost:5000";
}

/* ============================= */
/* COMPONENT                     */
/* ============================= */

export default function AuroraIntroPresence() {
  const [state, setState] = useState<AuroraState>("loading");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);

  const envFast = useRef(0);
  const envSlow = useRef(0);
  const envSmooth = useRef(0);

  const rotation = useRef(0);
  const time = useRef(0);
  const talkStart = useRef(0);

  // ✅ prevents double playback in dev strict mode
  const startedRef = useRef(false);

  /* ============================= */
  /* INIT PARTICLES                */
  /* ============================= */

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

  /* ============================= */
  /* FETCH INTRO + AUDIO SETUP     */
  /* ============================= */

  useEffect(() => {
    let mounted = true;

    async function startIntro() {
      if (startedRef.current) return;
      startedRef.current = true;

      try {
        const API_BASE = getApiBase();
        const url = `${API_BASE}/api/aurora/intro`;

        console.log("AURORA INTRO URL:", url);

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variation: "neutral" }),
        });

        console.log("AURORA INTRO STATUS:", res.status);

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("AURORA INTRO NOT OK:", txt);
          if (mounted) setState("done");
          return;
        }

        const contentType = res.headers.get("content-type") || "";
        console.log("AURORA INTRO CONTENT-TYPE:", contentType);

        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);

        const audio = new Audio(objectUrl);
        audioRef.current = audio;

        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.85;
        analyserRef.current = analyser;
        dataRef.current = new Uint8Array(analyser.fftSize);

        const source = ctx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(ctx.destination);

        audio.onplay = () => {
          envFast.current = 0;
          envSlow.current = 0;
          envSmooth.current = 0;
          talkStart.current = performance.now();
          if (mounted) setState("talking");
        };

        audio.onended = () => {
          if (mounted) setState("done");
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {}
        };

        await ctx.resume();
        await audio.play();
      } catch (e) {
        console.error("INTRO FAILED:", e);
        if (mounted) setState("done");
      }
    }

    startIntro();

    return () => {
      mounted = false;

      // cleanup audio
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = "";
        } catch {}
        audioRef.current = null;
      }

      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
        audioCtxRef.current = null;
      }

      startedRef.current = false;
    };
  }, []);

  /* ============================= */
  /* RENDER LOOP (FULL ENGINE)     */
  /* ============================= */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;

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

      let rms = 0;
      if (state === "talking" && analyserRef.current && dataRef.current) {
        analyserRef.current.getByteTimeDomainData(dataRef.current);
        let sum = 0;
        for (let i = 0; i < dataRef.current.length; i++) {
          const v = (dataRef.current[i] - 128) / 128;
          sum += v * v;
        }
        rms = Math.sqrt(sum / dataRef.current.length);
      }

      envFast.current += (rms - envFast.current) * 0.35;
      envSlow.current += (rms - envSlow.current) * 0.06;
      envSmooth.current += (rms - envSmooth.current) * 0.045;

      const energy = envSmooth.current;
      const syllable = clamp((envFast.current - envSlow.current) * 10, 0, 1);

      const hesitation = smoothstep(
        state === "talking"
          ? clamp((performance.now() - talkStart.current) / 260, 0, 1)
          : 0
      );

      const hueBase = 200;
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

      rotation.current += state === "talking" ? 0.0012 : 0.0004;

      const baseR = Math.min(w, h) * 0.32;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      for (const p of particlesRef.current) {
        const n = noise1(p.seed + p.angle * 3 + time.current * 0.55);
        const turb = (n - 0.5) * 0.006;

        p.angle += 0.00012 + (energy + syllable) * 0.0005 * hesitation;

        p.vel = 0.97 * p.vel + 0.03 * Math.random() * (1 - p.radius);

        p.radius += p.vel;
        p.radius = clamp(p.radius, 0.05, 1.7);

        const a = p.angle + rotation.current;
        const r = baseR * (p.radius + turb);

        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;

        const alpha = clamp(0.22 + syllable * 0.2, 0.15, 0.65);

        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue},85%,65%,${alpha})`;
        ctx.fill();
      }

      ctx.restore();
    };

    tick();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [state]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "black",
        zIndex: 9999,
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}