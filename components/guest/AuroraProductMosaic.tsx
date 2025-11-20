// components/guest/AuroraProductMosaic.tsx
// components/guest/AuroraProductMosaic.tsx
'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { MouseEvent } from 'react';
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
      title: 'Aurora Emotion Engine',
      desc: 'A real-time emotional intelligence system powered by multimodal neural vision.',
      icon: <FaBrain />,
      size: 'large',
    },
    {
      title: 'Live Emotion Scanning',
      desc: 'Instant emotional mapping using micro-expression analysis and facial cues.',
      icon: <FaCamera />,
      size: 'medium',
    },
    {
      title: 'Multimodal Neural Core',
      desc: 'Processes video, audio, and behavior signals using deep fusion networks.',
      icon: <FaRobot />,
      size: 'tall',
    },
    {
      title: 'Empathy Mapping',
      desc: 'Tracks valence, arousal, empathy score, and affective resonance in real-time.',
      icon: <FaHeart />,
      size: 'small',
    },
    {
      title: 'Avatar Emotional Mirroring',
      desc: 'Your avatar reacts to your emotional state — even without showing your face.',
      icon: <FaUserAstronaut />,
      size: 'wide',
    },
    {
      title: 'Aurora Insights',
      desc: 'Generates daily summaries, mood trends, and emotional performance metrics.',
      icon: <FaChartLine />,
      size: 'small',
    },
  ];

  return (
    <div
      className="mx-auto my-5 position-relative"
      style={{
        maxWidth: '1200px',
        display: 'grid',
        gap: '22px',
        gridTemplateAreas: `
          "large large medium"
          "tall  small  medium"
          "tall  wide  small"
        `,
        gridTemplateColumns: '1fr 1fr 1fr',
        alignContent: 'start',
        overflow: 'visible',
      }}
    >
      {/* 🌌 Floating Aurora Particles */}
      <AuroraParticles mode={mode} />

      {/* 🔗 Soft connection lines */}
      <AuroraConnections mode={mode} />

      {/* Cards */}
      {items.map((item, i) => (
        <MosaicCard key={i} {...item} index={i} mode={mode} />
      ))}
    </div>
  );
}

/* ============================================================
   🌌 FLOATING PARTICLES LAYER (Behind cards)
   ============================================================ */

function AuroraParticles({ mode }: { mode: 'light' | 'dark' }) {
  const dots = [
    { top: '8%', left: '10%', size: 6 },
    { top: '18%', left: '78%', size: 5 },
    { top: '42%', left: '6%', size: 7 },
    { top: '60%', left: '88%', size: 6 },
    { top: '76%', left: '38%', size: 5 },
    { top: '30%', left: '50%', size: 7 },
  ];

  const baseColor =
    mode === 'dark'
      ? 'rgba(0,200,255,0.75)'
      : 'rgba(37,99,235,0.75)';

  return (
    <div
      style={{
        position: 'absolute',
        inset: '-10px',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {dots.map((dot, i) => (
        <motion.span
          key={i}
          style={{
            position: 'absolute',
            top: dot.top,
            left: dot.left,
            width: dot.size,
            height: dot.size,
            borderRadius: '50%',
            background: baseColor,
            boxShadow:
              mode === 'dark'
                ? '0 0 12px rgba(0,200,255,0.8)'
                : '0 0 8px rgba(37,99,235,0.6)',
          }}
          animate={{
            y: [0, -8, 4, 0],
            opacity: [0.4, 0.9, 0.6, 0.4],
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   🔗 SVG CONNECTION LINES (Subtle neural links)
   ============================================================ */

function AuroraConnections({ mode }: { mode: 'light' | 'dark' }) {
  return (
    <motion.svg
      viewBox="0 0 1200 600"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <defs>
        <linearGradient id="auroraMosaicLine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00b7ff" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#00ffc8" />
        </linearGradient>
      </defs>

      {/* Central line from Emotion Engine → others */}
      <motion.path
        d="M 180 130 C 420 40, 720 80, 960 140"
        stroke="url(#auroraMosaicLine)"
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
        strokeDasharray="220"
        animate={{ strokeDashoffset: [220, 0, 220] }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          opacity: mode === 'dark' ? 0.55 : 0.35,
        }}
      />

      {/* Lower connection */}
      <motion.path
        d="M 220 360 C 460 420, 740 420, 980 360"
        stroke="url(#auroraMosaicLine)"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeDasharray="220"
        animate={{ strokeDashoffset: [220, 0, 220] }}
        transition={{
          duration: 8.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.2,
        }}
        style={{
          opacity: mode === 'dark' ? 0.5 : 0.3,
        }}
      />
    </motion.svg>
  );
}

/* ============================================================
   🔹 CARD COMPONENT — HYBRID DARK/LIGHT MODE + PARALLAX
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
  mode: 'light' | 'dark';
}) {
  const area = {
    large: 'large',
    medium: 'medium',
    small: 'small',
    wide: 'wide',
    tall: 'tall',
  }[size];

  /* 🌞 LIGHT MODE */
  const lightStyles = {
    background: 'linear-gradient(135deg, #ffffffdd, #f6f8ffcc)',
    border: '1.5px solid rgba(0,0,0,0.08)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
  };

  /* 🌚 DARK MODE */
  const darkStyles = {
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid rgba(255,255,255,0.14)',
    boxShadow: '0 0 20px rgba(0,200,255,0.15)',
  };

  /* 🌈 Icon gradient */
  const iconStyle = {
    fontSize: '2.4rem',
    marginBottom: '0.6rem',
    background: 'linear-gradient(135deg, #00c8ff, #a855f7, #00ffd0)',
    WebkitBackgroundClip: 'text' as const,
    WebkitTextFillColor: 'transparent' as const,
    filter:
      mode === 'dark'
        ? 'drop-shadow(0 0 8px rgba(0,200,255,0.35))'
        : 'drop-shadow(0 0 4px rgba(0,0,0,0.15))',
  };

  // 🌀 Parallax hover
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-40, 40], [8, -8]);
  const rotateY = useTransform(x, [-40, 40], [-8, 8]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const offsetX = e.clientX - (rect.left + rect.width / 2);
    const offsetY = e.clientY - (rect.top + rect.height / 2);
    x.set(offsetX / 6);
    y.set(offsetY / 6);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{ gridArea: area, zIndex: 1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: index * 0.05 }}
        whileHover={{
          scale: 1.03,
          boxShadow:
            mode === 'dark'
              ? '0 0 28px rgba(0,200,255,0.45)'
              : '0 8px 25px rgba(0,0,0,0.12)',
        }}
        className="p-4 position-relative"
        style={{
          borderRadius: '22px',
          backdropFilter: 'blur(14px)',
          cursor: 'pointer',
          overflow: 'hidden',
          transition: '.3s ease',
          transformStyle: 'preserve-3d',
          rotateX,
          rotateY,
          transformPerspective: 900,
          ...(mode === 'dark' ? darkStyles : lightStyles),
        }}
      >
        {/* Aurora Glow (Dark Mode Only) */}
        {mode === 'dark' && (
          <motion.div
            animate={{ opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{
              position: 'absolute',
              inset: -20,
              borderRadius: '22px',
              background:
                'linear-gradient(135deg, rgba(0,200,255,0.4), rgba(150,70,255,0.4), rgba(0,255,200,0.4))',
              filter: 'blur(45px)',
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
            background:
              'linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </h5>

        {/* Description */}
        <p
          className="text-secondary"
          style={{
            fontSize: '.92rem',
            lineHeight: '1.4rem',
          }}
        >
          {desc}
        </p>
      </motion.div>
    </motion.div>
  );
}



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
