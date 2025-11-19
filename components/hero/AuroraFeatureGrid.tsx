// components/

'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ReactNode } from 'react';
import { FaBrain, FaCamera, FaHeartbeat, FaWaveSquare } from 'react-icons/fa';

export default function AuroraFeatureGrid() {
  const features = [
    {
      title: "Emotion Detection",
      description:
        "Analyze facial micro-expressions using multimodal AI for real-time emotional insight.",
      icon: <FaBrain className='social-icon' size={40} />,
    },
    {
      title: "Live Camera Scanning",
      description:
        "Activate real-time emotion scanning powered by Aurora’s neural vision subsystem.",
      icon: <FaCamera className='social-icon' size={40} />,
    },
    {
      title: "Empathy Engine",
      description:
        "A psychological gradient model that decodes valence, arousal, and mental resonance.",
      icon: <FaHeartbeat className='social-icon' size={40} />,
    },
    {
      title: "Affective Signals",
      description:
        "Track and visualize emotional waves with AURORA’s high-frequency affective tracking.",
      icon: <FaWaveSquare className='social-icon' size={40} />,
    },
  ];

  return (
    <div className="container py-5">
      <div className="row g-4">
        {features.map((f, index) => (
          <div key={index} className="col-md-6 col-lg-3">
            <AuroraFeatureCard
              title={f.title}
              description={f.description}
              icon={f.icon}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   🔹 FEATURE CARD (MAXED OUT AURORA EFFECTS)
   ============================================================ */
function AuroraFeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  // Magnetic hover logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-40, 40], [8, -8]);
  const rotateY = useTransform(x, [-40, 40], [-8, 8]);

  const handleMouseMove = (e: any) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        perspective: 900,
      }}
    >
      <motion.div
        whileHover={{
          scale: 1.05,
          boxShadow: "0 0 28px rgba(0,140,255,0.55)",
        }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="p-4 h-100 position-relative"
        style={{
          borderRadius: "18px",
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "var(--foreground)",
          cursor: "pointer",
          overflow: "hidden",
        }}
      >
        {/* ✨ Aurora Background Glow */}
        <motion.div
          animate={{ opacity: [0.25, 0.6, 0.25] }}
          transition={{ duration: 6, repeat: Infinity }}
          style={{
            position: "absolute",
            inset: -25,
            borderRadius: "22px",
            background:
              "linear-gradient(135deg, rgba(0,180,255,0.6), rgba(150,70,255,0.6), rgba(0,255,200,0.5))",
            filter: "blur(45px)",
            zIndex: -1,
          }}
        />

        {/* ✨ Animated Gradient Border */}
        <motion.div
          animate={{
            opacity: [0.15, 0.5, 0.15],
          }}
          transition={{ duration: 5, repeat: Infinity }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "18px",
            border: "2px solid transparent",
            background:
              "linear-gradient(135deg, rgba(0,180,255,0.5), rgba(150,70,255,0.5), rgba(0,255,200,0.5)) border-box",
            WebkitMask:
              "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            pointerEvents: "none",
          }}
        />

        {/* ✨ ICON BLOCK — gradient + hologram flicker + pulse */}
        <motion.div
          animate={{
            opacity: [1, 0.85, 1],
            scale: [1, 1.03, 1],
            filter: [
              "drop-shadow(0 0 8px rgba(0,200,255,0.45))",
              "drop-shadow(0 0 4px rgba(150,70,255,0.25))",
              "drop-shadow(0 0 8px rgba(0,200,255,0.45))",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          whileHover={{ scale: 1.12 }}
          className="text-center mb-3"
          style={{
            background: "linear-gradient(135deg, #00c8ff, #a855f7, #00ffd0)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "2.4rem",
          }}
        >
          {icon}
        </motion.div>

        {/* TITLE */}
        <h5
          className="fw-bold text-center mb-2"
          style={{
            background:
              "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {title}
        </h5>

        {/* DESCRIPTION */}
        <p
          className="text-secondary text-center"
          style={{
            fontSize: "0.95rem",
            lineHeight: "1.4rem",
          }}
        >
          {description}
        </p>
      </motion.div>
    </motion.div>
  );
}

