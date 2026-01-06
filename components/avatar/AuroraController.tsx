// components/AuroraController.tsx
"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{
        width: "100%",
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      {/* AURORA VISUAL PRESENCE */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <AuroraPresence
          state={state}
          emotion={emotion}
          audio={audioRef.current}
        />
      </motion.div>

      {/* CONTROL PANEL */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          marginTop: 24,
          padding: 20,
          borderRadius: 18,
          background:
            "linear-gradient(135deg, rgba(80,120,255,0.15), rgba(180,80,255,0.12))",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.15)",
          display: "flex",
          gap: 16,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <AuroraButton onClick={start} glow>
          Begin
        </AuroraButton>

        <AuroraButton onClick={stop} danger>
          End
        </AuroraButton>
      </motion.div>

      {/* HEADLESS EMOTION / AUDIO LOGIC */}
      <RealTimeEmotionCamera
        ref={cameraRef}
        onEmotion={setEmotion}
        onStateChange={setState}
        audioRef={audioRef} 
      />
    </motion.div>
  );
}

/* ---------------------------------- */
/* AURORA BUTTON (POLISHED)            */
/* ---------------------------------- */

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
  const gradient = danger
    ? "linear-gradient(135deg, #ff5f6d, #d62976)"
    : "linear-gradient(135deg, #6a8cff, #9f7aea)";

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 26px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        fontSize: 15,
        fontWeight: 600,
        lineHeight: 1,
        color: "white",
        background: gradient,
        boxShadow: glow
          ? "0 0 20px rgba(140,120,255,0.45)"
          : "0 0 12px rgba(255,90,120,0.4)",
        letterSpacing: "0.3px",
        transform: "translateZ(0)", // prevents subpixel jitter
      }}
    >
      <span style={{ transform: "translateY(0.5px)" }}>
        {children}
      </span>
    </motion.button>
  );
}


{/*
// components/AuroraController.tsx
"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{
        width: "100%",
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
     
      <motion.div
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <AuroraPresence
          state={state}
          emotion={emotion}
          audio={audioRef.current}
        />
      </motion.div>

     
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          marginTop: 24,
          padding: 20,
          borderRadius: 18,
          background:
            "linear-gradient(135deg, rgba(80,120,255,0.15), rgba(180,80,255,0.12))",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.15)",
          display: "flex",
          gap: 16,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <AuroraButton onClick={start} glow>
          Begin
        </AuroraButton>

        <AuroraButton onClick={stop} danger>
          End
        </AuroraButton>
      </motion.div>

     
      <RealTimeEmotionCamera
        ref={cameraRef}
        onEmotion={setEmotion}        // still logged internally
        onStateChange={setState}      // still drives AuroraPresence
        audioRef={audioRef}
      />
    </motion.div>
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
  const gradient = danger
    ? "linear-gradient(135deg, #ff5f6d, #d62976)"
    : "linear-gradient(135deg, #6a8cff, #9f7aea)";

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        padding: "12px 26px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        fontSize: 15,
        fontWeight: 600,
        color: "white",
        background: gradient,
        boxShadow: glow
          ? "0 0 20px rgba(140,120,255,0.45)"
          : "0 0 12px rgba(255,90,120,0.4)",
        letterSpacing: "0.3px",
      }}
    >
      {children}
    </motion.button>
  );
}
*/}