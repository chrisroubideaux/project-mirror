// components/AuroraController.tsx
"use client";

import { useRef, useState } from "react";
import AuroraPresence from "@/components/avatar/AuroraPresence";
import RealTimeEmotionCamera, {
  AuroraState,
  EmotionPayload,
  RealTimeEmotionCameraHandle,
} from "@/components/camera/RealTimeEmotionCamera";

export default function AuroraController() {
  const [state, setState] = useState<AuroraState>("idle");
  const [emotion, setEmotion] = useState<EmotionPayload | null>(null);

  // AUDIO IS OWNED BY RealTimeEmotionCamera
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cameraRef = useRef<RealTimeEmotionCameraHandle | null>(null);

  const start = async () => {
    await cameraRef.current?.startSession();
  };

  const stop = () => {
    cameraRef.current?.stopSession();
  };

  return (
    <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
      {/* VISUALS */}
      <AuroraPresence
        state={state}
        emotion={emotion}
        audio={audioRef.current}
      />

      {/* CONTROLS */}
      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex",
          gap: 12,
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        <button className="btn" onClick={start}>
          Start Session
        </button>
        <button className="btn" onClick={stop}>
          Stop
        </button>

        <span>
          State: <b>{state}</b>
          {emotion?.emotion ? (
            <>
              {" "}
              | Emotion: <b>{emotion.emotion}</b>
            </>
          ) : null}
        </span>
      </div>

      {/* HEADLESS LOGIC */}
      <RealTimeEmotionCamera
        ref={cameraRef}
        onEmotion={setEmotion}
        onStateChange={setState}
        audioRef={audioRef}
      />
    </div>
  );
}
