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
    <section className="aurora-mosaic-section">
      {/* Section header */}
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
          Explore the core systems that power Aurora&apos;s emotional
          intelligence — from real-time scanning to avatar mirroring and
          long-term affective analytics.
        </p>
      </div>

      {/* Mosaic grid */}
      <div className="aurora-mosaic-container">
        <div className="aurora-mosaic-grid">
          {items.map((item, i) => (
            <MosaicCard key={i} {...item} index={i} mode={mode} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Card Component with 3D tilt + nano particles
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
  // 3D tilt motion values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [10, -10]);
  const rotateY = useTransform(x, [-60, 60], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - (rect.left + rect.width / 2);
    const offsetY = e.clientY - (rect.top + rect.height / 2);
    x.set(offsetX);
    y.set(offsetY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const iconStyle = {
    fontSize: "2.4rem",
    marginBottom: "0.6rem",
    background: "linear-gradient(135deg, #00c8ff, #a855f7, #00ffd0)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    filter:
      mode === "dark"
        ? "drop-shadow(0 0 8px rgba(0,200,255,0.35))"
        : "drop-shadow(0 0 4px rgba(0,0,0,0.15))",
  };

  // Deterministic nano-particle layout per card (no Math.random → no hydration issues)
  const particleLayout = particlePatterns[index % particlePatterns.length];

  return (
    <motion.div
      style={{
        perspective: 900,
      }}
      className={`size-${size}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: index * 0.06 }}
        whileHover={{
          scale: 1.03,
          boxShadow:
            mode === "dark"
              ? "0 0 28px rgba(0,200,255,0.45)"
              : "0 8px 25px rgba(0,0,0,0.12)",
        }}
        style={{
          rotateX,
          rotateY,
        }}
        className={`aurora-mosaic-card size-${size}`}
        data-theme={mode}
      >
        {/* Nano particle HUD layer */}
        <div className="aurora-nano-layer">
          {particleLayout.dots.map((dot, i) => (
            <motion.span
              key={i}
              className="aurora-nano-dot"
              style={{
                top: dot.top,
                left: dot.left,
              }}
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 3 + dot.delay,
                repeat: Infinity,
                repeatType: "mirror",
              }}
            />
          ))}

          {particleLayout.lines.map((line, i) => (
            <motion.span
              key={i}
              className="aurora-nano-line"
              style={{
                top: line.top,
                left: line.left,
                width: line.width,
                transform: `rotate(${line.angle}deg)`,
              }}
              animate={{
                opacity: [0.1, 0.5, 0.1],
              }}
              transition={{
                duration: 4 + line.delay,
                repeat: Infinity,
                repeatType: "mirror",
              }}
            />
          ))}
        </div>

        {/* Icon */}
        <div style={iconStyle}>{icon}</div>

        {/* Title */}
        <h5 className="aurora-mosaic-title">{title}</h5>

        {/* Description */}
        <p className="aurora-mosaic-desc">{desc}</p>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   Nano-particle patterns (no randomness → SSR safe)
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
  {
    dots: [
      { top: "16%", left: "65%", delay: 0.15 },
      { top: "34%", left: "18%", delay: 0.35 },
      { top: "56%", left: "76%", delay: 0.6 },
      { top: "82%", left: "30%", delay: 0.95 },
    ],
    lines: [
      { top: "24%", left: "50%", width: "50px", angle: 22, delay: 0.4 },
      { top: "60%", left: "26%", width: "65px", angle: -20, delay: 0.8 },
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
