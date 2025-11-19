// components/guest/AuroraProductMosaic.tsx
'use client';

import { motion } from 'framer-motion';
import {
  FaBrain,
  FaCamera,
  FaRobot,
  FaHeart,
  FaUserAstronaut,
  FaChartLine,
} from 'react-icons/fa';
import { useAppSelector } from '@/store/hooks';

export default function AuroraProductMosaic() {
  const mode = useAppSelector((state) => state.theme.mode);

  const items = [
    {
      title: "Aurora Emotion Engine",
      desc: "A real-time emotional intelligence system powered by multimodal neural vision.",
      icon: <FaBrain />,
      size: "large",
    },
    {
      title: "Live Emotion Scanning",
      desc: "Instant emotional mapping using micro-expression analysis and facial cues.",
      icon: <FaCamera />,
      size: "medium",
    },
    {
      title: "Multimodal Neural Core",
      desc: "Processes video, audio, and behavior signals using deep fusion networks.",
      icon: <FaRobot />,
      size: "tall",
    },
    {
      title: "Empathy Mapping",
      desc: "Tracks valence, arousal, empathy score, and affective resonance in real-time.",
      icon: <FaHeart />,
      size: "small",
    },
    {
      title: "Avatar Emotional Mirroring",
      desc: "Your avatar reacts to your emotional state — even without showing your face.",
      icon: <FaUserAstronaut />,
      size: "wide",
    },
    {
      title: "Aurora Insights",
      desc: "Generates daily summaries, mood trends, and emotional performance metrics.",
      icon: <FaChartLine />,
      size: "small",
    },
  ];

  return (
    <div
      className="mx-auto my-5"
      style={{
        maxWidth: "1200px",
        display: "grid",
        gap: "22px",
        gridTemplateAreas: `
          "large large medium"
          "tall small medium"
          "tall wide small"
        `,
        gridTemplateColumns: "1fr 1fr 1fr",
      }}
    >
      {items.map((item, i) => (
        <MosaicCard key={i} {...item} index={i} mode={mode} />
      ))}
    </div>
  );
}

/* ============================================================
   🔹 CARD COMPONENT — HYBRID DARK/LIGHT MODE ADAPTIVE STYLES
   ============================================================ */

function MosaicCard({
  title,
  desc,
  icon,
  size,
  index,
  mode,
}: {
  title: string;
  desc: string;
  icon: any;
  size: string;
  index: number;
  mode: "light" | "dark";
}) {
  const area = {
    large: "large",
    medium: "medium",
    small: "small",
    wide: "wide",
    tall: "tall",
  }[size];

  /* ============================================================
     🌞 LIGHT MODE LOOK
     Soft pastel gradients + subtle shadows
     ============================================================ */
  const lightStyles = {
    background: "linear-gradient(135deg, #ffffffdd, #f6f8ffcc)",
    border: "1.5px solid rgba(0,0,0,0.08)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
  };

  /* ============================================================
     🌚 DARK MODE LOOK
     Dark-glass with neon edges & hologram glow
     ============================================================ */
  const darkStyles = {
    background: "rgba(255,255,255,0.05)",
    border: "1.5px solid rgba(255,255,255,0.14)",
    boxShadow: "0 0 20px rgba(0,200,255,0.15)",
  };

  /* ============================================================
     🌈 Gradient Icon (always visible for both themes)
     ============================================================ */
  const iconStyle = {
    fontSize: "2.4rem",
    marginBottom: "0.6rem",
    background: "linear-gradient(135deg, #00c8ff, #a855f7, #00ffd0)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    filter: mode === "dark"
      ? "drop-shadow(0 0 8px rgba(0,200,255,0.35))"
      : "drop-shadow(0 0 4px rgba(0,0,0,0.15))",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      whileHover={{
        scale: 1.03,
        boxShadow:
          mode === "dark"
            ? "0 0 28px rgba(0,200,255,0.45)"
            : "0 8px 25px rgba(0,0,0,0.12)",
      }}
      className="p-4 h-100 position-relative"
      style={{
        gridArea: area,
        borderRadius: "22px",
        backdropFilter: "blur(14px)",
        cursor: "pointer",
        overflow: "hidden",
        transition: ".3s ease",
        ...(mode === "dark" ? darkStyles : lightStyles),
      }}
    >
      {/* Aurora Glow (Dark Mode Only) */}
      {mode === "dark" && (
        <motion.div
          animate={{ opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 5, repeat: Infinity }}
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: "22px",
            background:
              "linear-gradient(135deg, rgba(0,200,255,0.4), rgba(150,70,255,0.4), rgba(0,255,200,0.4))",
            filter: "blur(45px)",
            zIndex: -1,
          }}
        />
      )}

      {/* Icon */}
      <div style={iconStyle}>{icon}</div>

      {/* Title */}
      <h5
        className="fw-bold mb-2"
        style={{
          background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {title}
      </h5>

      {/* Description */}
      <p
        className="text-secondary"
        style={{
          fontSize: ".92rem",
          lineHeight: "1.4rem",
        }}
      >
        {desc}
      </p>
    </motion.div>
  );
}
