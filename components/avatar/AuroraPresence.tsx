// components/avatar/AuroraPresence.tsx
// components/avatar/AuroraPresence.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import RealTimeEmotionCamera, {
  AuroraState,
  EmotionPayload,
  RealTimeEmotionCameraHandle,
} from "@/components/camera/RealTimeEmotionCamera";
import { FaPlay, FaStop } from "react-icons/fa";


/* ============================= */
/* TYPES + HELPERS               */
/* ============================= */

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

/* ---------- Smooth noise ---------- */

function hash1(n: number) {
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}

function noise1(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  return lerp(hash1(i), hash1(i + 1), smoothstep(f));
}

/* ============================= */
/* AURORA PRESENCE (STANDALONE)  */
/* ============================= */

export default function AuroraPresence() {
  /* ---------- STATE ---------- */

  const [state, setState] = useState<AuroraState>("idle");
  const [emotion, setEmotion] = useState<EmotionPayload | null>(null);

  /* ---------- REFS ---------- */

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  const cameraRef = useRef<RealTimeEmotionCameraHandle | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ---------- AUDIO ---------- */

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);

  const envFast = useRef(0);
  const envSlow = useRef(0);
  const envSmooth = useRef(0);

  /* ---------- MOTION ---------- */

  const rotation = useRef(0);
  const time = useRef(0);

  const prevState = useRef<AuroraState>("idle");
  const talkStart = useRef(0);

  /* ============================= */
  /* CONTROLS LOGIC                */
  /* ============================= */

  const start = async () => {
    await cameraRef.current?.startSession();
  };

  const stop = () => {
    cameraRef.current?.stopSession();
  };

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
  /* AUDIO SETUP                   */
  /* ============================= */

  const ensureAudio = () => {
    const audio = audioRef.current;
    if (!audio || audio.readyState < 2) return;

    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();

    if (!analyserRef.current) {
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.fftSize);
    }

    if (!sourceRef.current) {
      sourceRef.current =
        audioCtxRef.current.createMediaElementSource(audio);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current!.connect(audioCtxRef.current.destination);
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  /* ============================= */
  /* AUDIO RESET ON PLAY           */
  /* ============================= */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const kick = () => {
      envFast.current = 0;
      envSlow.current = 0;
      envSmooth.current = 0;
      ensureAudio();
    };

    audio.addEventListener("play", kick);
    return () => audio.removeEventListener("play", kick);
  }, []);

  /* ============================= */
  /* MAIN RENDER LOOP              */
  /* ============================= */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const w = parent.clientWidth;
      const h = parent.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);

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

      let rms = 0;
      if (state === "talking") {
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

      const hesitation = smoothstep(
        state === "talking"
          ? clamp((performance.now() - talkStart.current) / 260, 0, 1)
          : 0
      );

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
          ? lerp(0.975, 0.955, hesitation)
          : 0.99;

      const c1 = 0.035;
      const c2 =
        state === "talking"
          ? lerp(0.015, 0.055, hesitation) *
            (0.8 + dominance * 0.6)
          : 0.015;

      const turbAmp = 0.006 * (0.25 + arousal * 1.2);
      const breath = Math.sin(time.current * 1.2) * 0.018;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      for (const p of particlesRef.current) {
        const n = noise1(p.seed + p.angle * 3 + time.current * 0.55);
        const turb = (n - 0.5) * turbAmp;

        p.angle +=
          0.00012 +
          (energy + syllable) *
            (0.0004 + dominance * 0.0003) *
            hesitation;

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

        const particleHue =
          hue +
          (valence - 0.5) * 40 +
          (p.seed % 1) * 14;

        const alpha = clamp(
          0.22 + valence * 0.25 + syllable * 0.12,
          0.15,
          0.65
        );

        ctx.beginPath();
        ctx.arc(x, y, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particleHue},85%,65%,${alpha * 0.12})`;
        ctx.fill();

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
  }, [state, emotion]);

  /* ============================= */
  /* RENDER (VIDEO PLAYER UI)     */
  /* ============================= */

  return (
    <div className="aurora-player">
      <div className="aurora-player__screen aurora-presence">
        <canvas ref={canvasRef} className="aurora-canvas" />
        <div className="aurora-vignette" />

        <div className="aurora-player__overlay">
          {state === "talking" && (
            <span className="aurora-player__live">LIVE</span>
          )}
        </div>
      </div>

      <div className="aurora-controls mt-3">
        <AuroraButton onClick={start} glow>
          <FaPlay className="aurora-btn__icon" />
          <span className="m-1">Begin</span>
        </AuroraButton>

        <AuroraButton onClick={stop} danger>
          <FaStop className="aurora-btn__icon" />
          <span className="m-1">End</span>
        </AuroraButton>
      </div>

      {/* HEADLESS CAMERA */}
      <RealTimeEmotionCamera
        ref={cameraRef}
        onEmotion={setEmotion}
        onStateChange={setState}
        audioRef={audioRef}
      />
    </div>
  );
}

/* ============================= */
/* AURORA PILL BUTTON            */
/* ============================= */

function AuroraButton({
  children,
  onClick,
  glow,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  glow?: boolean;
  danger?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      className={[
        "aurora-btn",
        glow ? "aurora-btn--glow" : "",
        danger ? "aurora-btn--danger" : "",
      ].join(" ")}
    >
      {children}
    </motion.button>
  );
}

{/*
// components/avatar/AuroraPresence.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import RealTimeEmotionCamera, {
  AuroraState,
  EmotionPayload,
  RealTimeEmotionCameraHandle,
} from "@/components/camera/RealTimeEmotionCamera";
import { FaPlay, FaStop } from "react-icons/fa";



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



function hash1(n: number) {
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}

function noise1(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  return lerp(hash1(i), hash1(i + 1), smoothstep(f));
}



export default function AuroraPresence() {
  

  const [state, setState] = useState<AuroraState>("idle");
  const [emotion, setEmotion] = useState<EmotionPayload | null>(null);


  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  const cameraRef = useRef<RealTimeEmotionCameraHandle | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);


  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);

  const envFast = useRef(0);
  const envSlow = useRef(0);
  const envSmooth = useRef(0);



  const rotation = useRef(0);
  const time = useRef(0);

  const prevState = useRef<AuroraState>("idle");
  const talkStart = useRef(0);


  const start = async () => {
    await cameraRef.current?.startSession();
  };

  const stop = () => {
    cameraRef.current?.stopSession();
  };



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
    const audio = audioRef.current;
    if (!audio || audio.readyState < 2) return;

    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();

    if (!analyserRef.current) {
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.fftSize);
    }

    if (!sourceRef.current) {
      sourceRef.current =
        audioCtxRef.current.createMediaElementSource(audio);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current!.connect(audioCtxRef.current.destination);
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const kick = () => {
      envFast.current = 0;
      envSlow.current = 0;
      envSmooth.current = 0;
      ensureAudio();
    };

    audio.addEventListener("play", kick);
    return () => audio.removeEventListener("play", kick);
  }, []);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const w = parent.clientWidth;
      const h = parent.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);

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

      let rms = 0;
      if (state === "talking") {
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

      const hesitation = smoothstep(
        state === "talking"
          ? clamp((performance.now() - talkStart.current) / 260, 0, 1)
          : 0
      );

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
          ? lerp(0.975, 0.955, hesitation)
          : 0.99;

      const c1 = 0.035;
      const c2 =
        state === "talking"
          ? lerp(0.015, 0.055, hesitation) *
            (0.8 + dominance * 0.6)
          : 0.015;

      const turbAmp = 0.006 * (0.25 + arousal * 1.2);
      const breath = Math.sin(time.current * 1.2) * 0.018;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      for (const p of particlesRef.current) {
        const n = noise1(p.seed + p.angle * 3 + time.current * 0.55);
        const turb = (n - 0.5) * turbAmp;

        p.angle +=
          0.00012 +
          (energy + syllable) *
            (0.0004 + dominance * 0.0003) *
            hesitation;

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

        const particleHue =
          hue +
          (valence - 0.5) * 40 +
          (p.seed % 1) * 14;

        const alpha = clamp(
          0.22 + valence * 0.25 + syllable * 0.12,
          0.15,
          0.65
        );

        ctx.beginPath();
        ctx.arc(x, y, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particleHue},85%,65%,${alpha * 0.12})`;
        ctx.fill();

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
  }, [state, emotion]);


  return (
    <div className="aurora-player">
      <div className="aurora-player__screen aurora-presence">
        <canvas ref={canvasRef} className="aurora-canvas" />
        <div className="aurora-vignette" />

        <div className="aurora-player__overlay">
          {state === "talking" && (
            <span className="aurora-player__live">LIVE</span>
          )}
        </div>
      </div>

      <div className="aurora-controls mt-3">
        <AuroraButton onClick={start} glow>
          <FaPlay className="aurora-btn__icon" />
          <span className="m-1">Begin</span>
        </AuroraButton>

        <AuroraButton onClick={stop} danger>
          <FaStop className="aurora-btn__icon" />
          <span className="m-1">End</span>
        </AuroraButton>
      </div>

   
      <RealTimeEmotionCamera
        ref={cameraRef}
        onEmotion={setEmotion}
        onStateChange={setState}
        audioRef={audioRef}
      />
    </div>
  );
}


function AuroraButton({
  children,
  onClick,
  glow,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  glow?: boolean;
  danger?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      className={[
        "aurora-btn",
        glow ? "aurora-btn--glow" : "",
        danger ? "aurora-btn--danger" : "",
      ].join(" ")}
    >
      {children}
    </motion.button>
  );
}


*/}