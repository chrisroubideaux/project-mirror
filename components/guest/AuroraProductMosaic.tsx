// components/guest/AuroraProductMosaic.tsx

// components/guest/AuroraProductMosaic.tsx

'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
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
    { size: "large",  title: "Aurora Emotion Engine", desc: "A real-time emotional intelligence system powered by multimodal neural vision.", icon: <FaBrain /> },
    { size: "medium", title: "Live Emotion Scanning", desc: "Instant emotional mapping using micro-expression analysis and facial cues.", icon: <FaCamera /> },
    { size: "tall",   title: "Multimodal Neural Core", desc: "Processes video, audio, and behavior signals using deep fusion networks.", icon: <FaRobot /> },
    { size: "small1", title: "Empathy Mapping", desc: "Tracks valence, arousal, empathy score, and affective resonance in real-time.", icon: <FaHeart /> },
    { size: "wide",   title: "Avatar Emotional Mirroring", desc: "Your avatar reacts to your emotional state — even without showing your face.", icon: <FaUserAstronaut /> },
    { size: "small2", title: "Aurora Insights", desc: "Generates daily summaries, mood trends, and emotional performance metrics.", icon: <FaChartLine /> },
  ];

  return (
    <section className="aurora-mosaic-section">

      {/* Section header — correct place */}
      <div className="text-center mb-4 mb-md-5">
        <h2
          className="fw-bold mb-2"
          style={{
            background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Aurora Feature Mosaic
        </h2>
        <p
          className="text-secondary"
          style={{ maxWidth: "620px", margin: "0 auto", fontSize: "0.95rem" }}
        >
          Explore the core systems that power Aurora&apos;s emotional intelligence —
          from real-time scanning to avatar mirroring and long-term affective analytics.
        </p>
      </div>

      {/* MOSAIC GRID */}
      <div
        className="aurora-mosaic-grid"
        style={{
          maxWidth: "1200px",
          margin: "3rem auto",
          display: "grid",
          gap: "22px",
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateAreas: `
            "large  large  medium"
            "tall   small1 medium"
            "tall   wide   small2"
          `
        }}
      >
        {items.map((item, i) => (
          <MosaicCard key={i} index={i} {...item} mode={mode} />
        ))}
      </div>
    </section>
  );
}


/* ============================================================
   MOSAIC CARD
   ============================================================ */

function MosaicCard({ title, desc, icon, size, index, mode }: any) {
  const area = size;

  // TILT
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [10, -10]);
  const rotateY = useTransform(x, [-60, 60], [-10, 10]);

  const handleMove = (e: any) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - (r.left + r.width / 2));
    y.set(e.clientY - (r.top + r.height / 2));
  };

  // PARTICLES
  const particles = particlePatterns[index % particlePatterns.length];

  return (
    <motion.div
      className="aurora-mosaic-card"
      style={{
        gridArea: area,
        position: "relative",
        padding: "1.5rem",
        borderRadius: "22px",
        backdropFilter: "blur(14px)",
        overflow: "hidden",
        cursor: "pointer",
        rotateX,
        rotateY,
        ...(mode === "dark"
          ? {
              background: "rgba(255,255,255,0.05)",
              border: "1.5px solid rgba(255,255,255,0.14)",
              boxShadow: "0 0 20px rgba(0,200,255,0.15)",
            }
          : {
              background: "linear-gradient(135deg, #ffffffdd, #f6f8ffcc)",
              border: "1.5px solid rgba(0,0,0,0.08)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
            }),
      }}
      onMouseMove={handleMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >

      {/* NANO PARTICLES */}
      <div className="aurora-nano-layer">
        {particles.dots.map((d: any, i: number) => (
          <motion.span
            key={i}
            className="aurora-nano-dot"
            style={{ top: d.top, left: d.left }}
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
            transition={{ duration: 3 + d.delay, repeat: Infinity }}
          />
        ))}

        {particles.lines.map((l: any, i: number) => (
          <motion.span
            key={i}
            className="aurora-nano-line"
            style={{
              top: l.top,
              left: l.left,
              width: l.width,
              transform: `rotate(${l.angle}deg)`
            }}
            animate={{ opacity: [0.1, 0.5, 0.1] }}
            transition={{ duration: 4 + l.delay, repeat: Infinity }}
          />
        ))}
      </div>

      {/* ICON */}
      <div
        style={{
          fontSize: "2.4rem",
          marginBottom: ".6rem",
          background: "linear-gradient(135deg,#00c8ff,#a855f7,#00ffd0)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {icon}
      </div>

      {/* TITLE */}
      <h5 className="aurora-mosaic-title">{title}</h5>

      {/* DESCRIPTION */}
      <p className="aurora-mosaic-desc">{desc}</p>
    </motion.div>
  );
}



/* ============================================================
   PARTICLE PATTERNS
   ============================================================ */
const particlePatterns = [
  {
    dots: [
      { top: "12%", left: "18%", delay: 0.1 },
      { top: "26%", left: "72%", delay: 0.3 },
      { top: "58%", left: "14%", delay: 0.5 },
      { top: "70%", left: "68%", delay: 0.8 },
    ],
    lines: [
      { top: "20%", left: "22%", width: "40px", angle: 12, delay: 0.2 },
      { top: "64%", left: "40%", width: "60px", angle: -18, delay: 0.6 },
    ],
  },
  {
    dots: [
      { top: "18%", left: "28%", delay: 0.2 },
      { top: "40%", left: "80%", delay: 0.4 },
      { top: "68%", left: "22%", delay: 0.7 },
      { top: "78%", left: "60%", delay: 0.9 },
    ],
    lines: [
      { top: "30%", left: "30%", width: "48px", angle: -10, delay: 0.3 },
      { top: "72%", left: "46%", width: "55px", angle: 16, delay: 0.7 },
    ],
  },
];


{/*
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

  
  const lightStyles = {
    background: "linear-gradient(135deg, #ffffffdd, #f6f8ffcc)",
    border: "1.5px solid rgba(0,0,0,0.08)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
  };

  
  const darkStyles = {
    background: "rgba(255,255,255,0.05)",
    border: "1.5px solid rgba(255,255,255,0.14)",
    boxShadow: "0 0 20px rgba(0,200,255,0.15)",
  };

 
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

      <div style={iconStyle}>{icon}</div>

   
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

*/}
