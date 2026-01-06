// components/avatar/AuroraPlayer.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import AuroraPresence from "@/components/avatar/AuroraPresence";
import RealTimeEmotionCamera, {
  AuroraState,
  EmotionPayload,
  RealTimeEmotionCameraHandle,
} from "@/components/camera/RealTimeEmotionCamera";



export default function AuroraPlayer() {
  const prefersReducedMotion = useReducedMotion();

  const [state, setState] = useState<AuroraState>("idle");
  const [emotion, setEmotion] = useState<EmotionPayload | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<number | null>(null);

  // AUDIO IS OWNED BY RealTimeEmotionCamera
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cameraRef = useRef<RealTimeEmotionCameraHandle | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const start = async () => {
    await cameraRef.current?.startSession();
    revealControlsForABit();
  };

  const stop = () => {
    cameraRef.current?.stopSession();
    revealControlsForABit();
  };

  // ----------------------------
  // Fullscreen API
  // ----------------------------
  const requestFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;

    try {
      // @ts-ignore - TS lib dom types vary
      if (el.requestFullscreen) await el.requestFullscreen();
      // @ts-ignore
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      // @ts-ignore
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
    } catch {
      // silently ignore
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      // @ts-ignore
      else if (document.webkitFullscreenElement) document.webkitExitFullscreen?.();
      // @ts-ignore
      else if (document.msFullscreenElement) document.msExitFullscreen?.();
    } catch {
      // silently ignore
    }
  };

  const toggleFullscreen = async () => {
    if (isFullscreen) await exitFullscreen();
    else await requestFullscreen();
    revealControlsForABit();
  };

  useEffect(() => {
    const onFsChange = () => {
      const fs =
        !!document.fullscreenElement ||
        // @ts-ignore
        !!document.webkitFullscreenElement ||
        // @ts-ignore
        !!document.msFullscreenElement;

      setIsFullscreen(fs);
      // show controls briefly when entering/exiting FS
      setControlsVisible(true);
      revealControlsForABit();
    };

    document.addEventListener("fullscreenchange", onFsChange);
    // @ts-ignore
    document.addEventListener("webkitfullscreenchange", onFsChange);
    // @ts-ignore
    document.addEventListener("MSFullscreenChange", onFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      // @ts-ignore
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      // @ts-ignore
      document.removeEventListener("MSFullscreenChange", onFsChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

 
  // ----------------------------
  
  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const revealControlsForABit = () => {
    clearHideTimer();
    setControlsVisible(true);

    if (!isFullscreen) return; // keep visible in normal mode

    hideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 2200);
  };

  const onPointerActivity = () => {
    // only auto-hide in fullscreen
    if (isFullscreen) revealControlsForABit();
    else setControlsVisible(true);
  };

  useEffect(() => {
    return () => clearHideTimer();
  }, []);

  // ----------------------------
  // Emotion-weighted glow (fullscreen only)
  // - arousal -> intensity
  // - valence -> warmth/coolness bias
  // ----------------------------
  const glow = useMemo(() => {
    const v = clamp01(emotion?.valence, 0.5);
    const a = clamp01(emotion?.arousal, 0.4);

    // intensity scales with arousal
    const intensity = lerp(0.18, 0.65, a);

    // warm vs cool bias with valence (0..1)
    // (we keep it subtle: just a different tint blend)
    const warmAlpha = lerp(0.05, 0.25, v) * intensity;
    const coolAlpha = lerp(0.25, 0.05, v) * intensity;

    // glow size with arousal
    const blur = Math.round(lerp(26, 64, a));
    const spread = Math.round(lerp(6, 18, a));

    // Build a multi-layer shadow for a "nebula" feel
    const warm = `0 0 ${blur}px ${spread}px rgba(255, 110, 196, ${warmAlpha})`;
    const cool = `0 0 ${blur}px ${spread}px rgba(110, 180, 255, ${coolAlpha})`;
    const violet = `0 0 ${Math.round(blur * 0.75)}px ${Math.round(
      spread * 0.75
    )}px rgba(170, 120, 255, ${intensity * 0.18})`;

    return { boxShadow: `${cool}, ${warm}, ${violet}`, intensity };
  }, [emotion?.valence, emotion?.arousal]);

  // ----------------------------
  // Cinematic backdrop + subtle vignette
  // ----------------------------
  const backgroundStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: isFullscreen ? 0 : 22,
    overflow: "hidden",
    background:
      "radial-gradient(1200px 600px at 20% 10%, rgba(100,140,255,0.20), transparent 60%)," +
      "radial-gradient(900px 500px at 75% 20%, rgba(190,90,255,0.14), transparent 55%)," +
      "radial-gradient(800px 500px at 40% 95%, rgba(80,220,200,0.12), transparent 55%)," +
      "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.92))",
    filter: "saturate(1.05)",
  };

  const vignetteStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(1200px 800px at 50% 35%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)",
    opacity: isFullscreen ? 1 : 0.85,
  };

  // ----------------------------
  // Layout
  // ----------------------------
  return (
    <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto" }}>
      <motion.div
        ref={containerRef}
        onMouseMove={onPointerActivity}
        onMouseEnter={onPointerActivity}
        onTouchStart={onPointerActivity}
        initial={false}
        animate={
          prefersReducedMotion
            ? {}
            : {
                scale: isFullscreen ? 1 : 1,
              }
        }
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: isFullscreen ? undefined : "16/9",
          minHeight: isFullscreen ? "100vh" : undefined,
          borderRadius: isFullscreen ? 0 : 22,
          overflow: "hidden",
          border: isFullscreen ? "none" : "1px solid rgba(255,255,255,0.14)",
          background: "rgba(0,0,0,0.6)",
          boxShadow: isFullscreen ? glow.boxShadow : "0 18px 70px rgba(0,0,0,0.55)",
          transform: "translateZ(0)",
        }}
      >
        {/* Cinematic background */}
        <motion.div
          aria-hidden
          style={backgroundStyle}
          animate={
            prefersReducedMotion
              ? {}
              : {
                  opacity: 1,
                  scale: [1, 1.02, 1],
                }
          }
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Soft film grain (CSS-only approximation) */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.08,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
            backgroundSize: "220px 220px",
            mixBlendMode: "overlay",
          }}
        />

        {/* Vignette */}
        <div aria-hidden style={vignetteStyle} />

        {/* Presence stage */}
        <motion.div
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            height: "100%",
            display: "grid",
            placeItems: "center",
            padding: isFullscreen ? 18 : 18,
          }}
          animate={
            prefersReducedMotion
              ? {}
              : {
                  y: [0, -6, 0],
                }
          }
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <AuroraPresence
            state={state}
            emotion={emotion}
            audio={audioRef.current}
          />
        </motion.div>

        {/* Controls overlay (Netflix-ish) */}
        <AnimatePresence>
          {(controlsVisible || !isFullscreen) && (
            <motion.div
              key="controls"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 4,
                padding: isFullscreen ? 18 : 14,
                pointerEvents: "auto",
              }}
            >
              {/* Gradient scrim behind controls */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.86) 100%)",
                }}
              />

              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                {/* Left cluster */}
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <AuroraPill
                    onClick={start}
                    variant="primary"
                    title="Begin session"
                    icon="▶"
                  >
                    Begin
                  </AuroraPill>

                  <AuroraPill
                    onClick={stop}
                    variant="danger"
                    title="End session"
                    icon="■"
                  >
                    End
                  </AuroraPill>

                  <StatusDot state={state} />
                </div>

                {/* Right cluster */}
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <AuroraPill
                    onClick={toggleFullscreen}
                    variant="glass"
                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    icon={isFullscreen ? "⤢" : "⤢"}
                  >
                    {isFullscreen ? "Exit" : "Fullscreen"}
                  </AuroraPill>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtle top title (only when fullscreen, optional) */}
        <AnimatePresence>
          {isFullscreen && controlsVisible && (
            <motion.div
              key="topbar"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                zIndex: 4,
                padding: 16,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  color: "rgba(255,255,255,0.86)",
                  fontSize: 13,
                  letterSpacing: "0.25px",
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.75)",
                    boxShadow: "0 0 16px rgba(170,120,255,0.55)",
                  }}
                />
                Aurora Presence
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Headless engine embedded */}
        <RealTimeEmotionCamera
          ref={cameraRef}
          onEmotion={(e) => {
            setEmotion(e);
            // Keep logging if you want:
            // console.log("emotion:", e);
          }}
          onStateChange={(s) => {
            setState(s);
            // Keep logging if you want:
            // console.log("state:", s);
          }}
          audioRef={audioRef}
        />
      </motion.div>
    </div>
  );
}

/* ------------------------------ */
/* UI Bits                         */
/* ------------------------------ */

function AuroraPill({
  children,
  onClick,
  icon,
  title,
  variant = "glass",
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: string;
  title?: string;
  variant?: "primary" | "danger" | "glass";
}) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 650,
    letterSpacing: "0.2px",
    color: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    userSelect: "none",
    outline: "none",
  };

  const stylesByVariant: Record<string, React.CSSProperties> = {
    glass: {
      background: "rgba(0,0,0,0.25)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    },
    primary: {
      background: "linear-gradient(135deg, rgba(106,140,255,0.95), rgba(159,122,234,0.92))",
      border: "1px solid rgba(255,255,255,0.18)",
      boxShadow: "0 14px 40px rgba(120,140,255,0.22)",
    },
    danger: {
      background: "linear-gradient(135deg, rgba(255,95,109,0.95), rgba(214,41,118,0.92))",
      border: "1px solid rgba(255,255,255,0.18)",
      boxShadow: "0 14px 40px rgba(255,90,120,0.18)",
    },
  };

  const style = { ...base, ...(stylesByVariant[variant] || stylesByVariant.glass) };

  return (
    <motion.button
      type="button"
      title={title}
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      style={style}
    >
      {icon ? (
        <span
          aria-hidden
          style={{
            width: 22,
            height: 22,
            display: "grid",
            placeItems: "center",
            borderRadius: 999,
            background: "rgba(0,0,0,0.22)",
            border: "1px solid rgba(255,255,255,0.14)",
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
}

function StatusDot({ state }: { state: AuroraState }) {
  const cfg = useMemo(() => {
    if (state === "talking")
      return { label: "Talking", pulse: true, color: "rgba(170,120,255,0.95)" };
    if (state === "listening")
      return { label: "Listening", pulse: true, color: "rgba(110,180,255,0.95)" };
    return { label: "Idle", pulse: false, color: "rgba(255,255,255,0.55)" };
  }, [state]);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.22)",
        color: "rgba(255,255,255,0.82)",
        fontSize: 12.5,
        backdropFilter: "blur(12px)",
      }}
      title={`Aurora is ${cfg.label.toLowerCase()}`}
    >
      <motion.span
        aria-hidden
        animate={
          cfg.pulse
            ? { scale: [1, 1.35, 1], opacity: [0.75, 1, 0.75] }
            : { scale: 1, opacity: 0.75 }
        }
        transition={cfg.pulse ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : {}}
        style={{
          width: 9,
          height: 9,
          borderRadius: 999,
          background: cfg.color,
          boxShadow: `0 0 18px ${cfg.color}`,
        }}
      />
      <span style={{ opacity: 0.9 }}>{cfg.label}</span>
    </div>
  );
}

/* ------------------------------ */
/* Utils                           */
/* ------------------------------ */

function clamp01(v: any, d = 0.5) {
  const n = Number(v);
  if (Number.isNaN(n)) return d;
  return Math.max(0, Math.min(1, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}