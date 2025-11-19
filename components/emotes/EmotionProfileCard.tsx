// 
'use client';

import { motion } from "framer-motion";

interface EmotionProfileProps {
  primary?: string;
  confidence?: number;
  valence?: number;
  arousal?: number;
}

export default function EmotionProfileCard({
  primary = "Neutral",
  confidence = 0.82,
  valence = 0.45,
  arousal = 0.33
}: EmotionProfileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="mx-auto my-4 p-4"
      style={{
        maxWidth: "420px",
        borderRadius: "22px",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.15)",
        position: "relative",
        overflow: "hidden",
        color: "var(--foreground)",
      }}
    >

      {/* AURORA BORDER GLOW */}
      <motion.div
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 6, repeat: Infinity }}
        style={{
          position: "absolute",
          inset: -2,
          borderRadius: "22px",
          background:
            "linear-gradient(135deg, rgba(0,180,255,0.6), rgba(150,70,255,0.6), rgba(0,255,190,0.5))",
          zIndex: -1,
          filter: "blur(25px)",
        }}
      />

      {/* TITLE */}
      <h3 className="fw-bold text-center mb-3"
        style={{
          background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
        Emotion Profile
      </h3>

      {/* MAIN EMOTION */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <h4 className="fw-semibold mb-1">{primary}</h4>
        <p className="text-secondary mb-0">
          Confidence: {(confidence * 100).toFixed(0)}%
        </p>
      </motion.div>

      {/* EMOTION WHEEL */}
      <div className="d-flex justify-content-center mb-4">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background:
              "conic-gradient(#ff5f6d, #ffc371, #47d1ff, #9d50bb, #ff5f6d)",
            opacity: 0.85,
            filter: "blur(1px)",
            position: "relative",
          }}
        />

        {/* Inner circle */}
        <div
          style={{
            position: "absolute",
            width: "110px",
            height: "110px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        />
      </div>

      {/* METRICS */}
      <div className="mt-3">
        <MetricBar label="Valence" value={valence} />
        <MetricBar label="Arousal" value={arousal} />
      </div>

    </motion.div>
  );
}

/* 🔹 Small helper component for Valence + Arousal bars */
function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between">
        <span>{label}</span>
        <span>{(value * 100).toFixed(0)}%</span>
      </div>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value * 100}%` }}
        transition={{ duration: 0.8 }}
        style={{
          height: "8px",
          borderRadius: "8px",
          background:
            "linear-gradient(90deg, #00b7ff, #a855f7, #00ffc8)",
          marginTop: "4px",
        }}
      />
    </div>
  );
}
