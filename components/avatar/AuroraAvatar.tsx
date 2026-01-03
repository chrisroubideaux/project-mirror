// components/avatar/AuroraAvatar.tsx
"use client";

import { useEffect, useRef } from "react";

export type AuroraState = "idle" | "talking" | "listening";

interface Props {
  state: AuroraState;
}

const VIDEO_SRC = {
  idle: "/idle/aurora_idle_neutral.mp4",
  talking: "/talk/aurora_talk_neutral_explain.mp4",
  listening: "/listen/aurora_listening_intense.mp4",
};

export default function AuroraAvatar({ state }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // HARD RESET ON EVERY STATE CHANGE
    v.pause();
    v.currentTime = 0;
    v.loop = false;

    v.src = VIDEO_SRC[state];
    v.load();

    // Only play for talking / listening
    if (state !== "idle") {
      v.play().catch(() => {});
    }
  }, [state]);

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      controls
      style={{
        width: "100%",
        maxWidth: 960,
        borderRadius: 16,
        background: "#000",
      }}
    />
  );
}
