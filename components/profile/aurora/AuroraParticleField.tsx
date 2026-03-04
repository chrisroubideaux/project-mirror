// components/profile/aurora/AuroraParticleField.tsx  
"use client";

import { useEffect, useRef } from "react";
import type { AuroraMode, PAD } from "./types";
import { blendHybrid } from "./utils/emotionBlend";
import { mapPADToVisual } from "./utils/particleMapping";

type Particle = {
  angle: number;
  radius: number;
  vel: number;
  seed: number;
};

type Props = {
  mode: AuroraMode;
  baselineTarget: PAD;
  liveTarget: PAD | null;
  audioEnergy: number; // 0..1
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
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
const clamp01 = (n: number) => clamp(n, 0, 1);

export default function AuroraParticleField({ mode, baselineTarget, liveTarget, audioEnergy }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // smoothed state (refs only)
  const baselineCurrent = useRef<PAD>({ ...baselineTarget });
  const liveCurrent = useRef<PAD>({ ...(liveTarget ?? baselineTarget) });
  const energyCurrent = useRef(0);

  const time = useRef(0);
  const rotation = useRef(0);

  const initParticles = (count: number) => {
    particlesRef.current = Array.from({ length: count }).map(() => {
      const r = Math.sqrt(Math.random());
      return {
        angle: Math.random() * Math.PI * 2,
        radius: r,
        vel: 0,
        seed: Math.random() * 999,
      };
    });
  };

  useEffect(() => {
    // update targets smoothly via render loop, but ensure starting values aren’t stale
    // do NOT set state here (no re-render loops)
  }, [baselineTarget, liveTarget, audioEnergy, mode]);

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

      // --- smooth energy ---
      energyCurrent.current += (audioEnergy - energyCurrent.current) * 0.25;
      const e = clamp01(energyCurrent.current);

      // --- smooth baseline (slow) ---
      baselineCurrent.current.valence += (baselineTarget.valence - baselineCurrent.current.valence) * 0.02;
      baselineCurrent.current.arousal += (baselineTarget.arousal - baselineCurrent.current.arousal) * 0.02;
      baselineCurrent.current.dominance += (baselineTarget.dominance - baselineCurrent.current.dominance) * 0.02;

      // --- smooth live (fast in) ---
      const liveT = liveTarget ?? baselineTarget;

      // if settling/idle, live naturally tends back toward baseline (by making target baseline)
      const effectiveLiveTarget =
        mode === "settling" || mode === "idle" ? baselineTarget : liveT;

      const liveAlpha = mode === "thinking" ? 0.12 : 0.25; // slightly calmer while "thinking"
      liveCurrent.current.valence += (effectiveLiveTarget.valence - liveCurrent.current.valence) * liveAlpha;
      liveCurrent.current.arousal += (effectiveLiveTarget.arousal - liveCurrent.current.arousal) * liveAlpha;
      liveCurrent.current.dominance += (effectiveLiveTarget.dominance - liveCurrent.current.dominance) * liveAlpha;

      // --- render emotion ---
      const renderPAD = blendHybrid(baselineCurrent.current, liveCurrent.current, e);
      const visual = mapPADToVisual(renderPAD);

      // --- background ---
      const breathe = Math.sin(time.current * 0.4) * 8;
      const hue = visual.hue + breathe;

      const bg = ctx.createRadialGradient(
        cx,
        cy,
        Math.min(w, h) * 0.2,
        cx,
        cy,
        Math.max(w, h)
      );

      bg.addColorStop(0, `hsla(${hue},70%,55%,0.22)`);
      bg.addColorStop(0.5, `hsla(${hue - 30},55%,30%,0.33)`);
      bg.addColorStop(1, `hsla(${hue - 60},40%,10%,0.50)`);

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // --- motion dynamics ---
      const speakingBoost = mode === "speaking" ? 1 : 0.55;
      rotation.current += visual.speed * speakingBoost;

      const baseR = Math.min(w, h) * 0.32 * visual.tightness;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      for (const p of particlesRef.current) {
        const n = noise1(p.seed + p.angle * 3 + time.current * 0.55);
        const turb = (n - 0.5) * 0.006;

        // orbit speed influenced by arousal + audio energy
        const orbitBoost = (renderPAD.arousal * 0.0008 + e * 0.0010) * speakingBoost;

        p.angle += 0.00012 + orbitBoost;

        p.vel = 0.97 * p.vel + 0.03 * Math.random() * (1 - p.radius);
        p.radius += p.vel;
        p.radius = clamp(p.radius, 0.05, 1.7);

        const a = p.angle + rotation.current;
        const r = baseR * (p.radius + turb);

        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;

        const alpha = clamp(0.18 + visual.glow * 0.45 + e * 0.12, 0.12, 0.78);

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
  }, [mode, baselineTarget, liveTarget, audioEnergy]);

  return (
    <div style={{ position: "absolute", inset: 0, background: "black" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}