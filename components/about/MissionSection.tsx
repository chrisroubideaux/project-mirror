// components/about/MissionSection.tsx
'use client';

import { motion } from "framer-motion";
import {
  FaUserAstronaut,
  FaComments,
  FaBolt,
  FaWifi,
  FaChartLine,
  FaPuzzlePiece,
} from "react-icons/fa";
import AuroraWave from "./AuroraWave";

export default function MissionSection() {
  const items = [
    {
      icon: <FaUserAstronaut className="social-icon" />,
      title: "Human-Centered Design",
      desc: "Creating emotionally-aware systems that prioritize the human experience.",
    },
    {
      icon: <FaComments className="social-icon" />,
      title: "Emotional Communication",
      desc: "Teaching AI to read micro-expressions, vocal tone, and behavioral nuance.",
    },
    {
      icon: <FaBolt className="social-icon" />,
      title: "Adaptive Intelligence",
      desc: "Real-time adjustments to emotion and context using deep learning.",
    },
    {
      icon: <FaWifi className="social-icon" />,
      title: "Connected Insight",
      desc: "Linking emotional patterns for higher contextual understanding.",
    },
    {
      icon: <FaPuzzlePiece className="social-icon" />,
      title: "Cognitive Synergy",
      desc: "Blending neuroscience, psychology, and AI to form a unified model.",
    },
    {
      icon: <FaChartLine className="social-icon" />,
      title: "Ethical Transparency",
      desc: "Clear and honest emotional analytics without hidden mechanics.",
    },
  ];

  return (
    <section className="py-5 position-relative">
      <AuroraWave height={150} />

      {/* AURORA TIMELINE–STYLE BENTO WRAPPER */}
      <div
        className="mx-auto p-4 p-md-5 position-relative container-fluid"
        style={{
        
          borderRadius: "28px",
          backdropFilter: "blur(18px)",
          overflow: "hidden",
          background: "var(--aurora-bento-bg)",
          border: "1px solid var(--aurora-bento-border)",
          boxShadow:
            "0 0 28px rgba(0,180,255,0.15), inset 0 0 12px rgba(255,255,255,0.05)",
        }}
      >
        {/* OUTER SOFT GLOW LAYER */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "28px",
            background:
              "linear-gradient(135deg, rgba(0,180,255,0.05), rgba(168,85,247,0.05), rgba(0,255,200,0.05))",
            pointerEvents: "none",
          }}
          animate={{ opacity: [0.2, 0.4, 0.25] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        {/* SMOOTH SMOKE GLOWS (MATCH TIMELINE COMPONENT) */}
        <div
          style={{
            position: "absolute",
            inset: "-40px 0 0 0",
            zIndex: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <motion.div
            style={{
              position: "absolute",
              top: "-50px",
              left: "-40px",
              width: "260px",
              height: "260px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(0,183,255,0.45), transparent)",
              filter: "blur(35px)",
            }}
            animate={{ opacity: [0.2, 0.5, 0.3], x: [0, 15, -10, 0] }}
            transition={{ duration: 14, repeat: Infinity }}
          />

          <motion.div
            style={{
              position: "absolute",
              top: "120px",
              right: "-40px",
              width: "260px",
              height: "260px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(168,85,247,0.45), transparent)",
              filter: "blur(40px)",
            }}
            animate={{ opacity: [0.25, 0.6, 0.35], y: [0, -15, 10, 0] }}
            transition={{ duration: 16, repeat: Infinity }}
          />

          <motion.div
            style={{
              position: "absolute",
              bottom: "-60px",
              left: "15%",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(0,255,200,0.4), transparent)",
              filter: "blur(50px)",
            }}
            animate={{ opacity: [0.15, 0.4, 0.25], x: [0, -10, 8, 0] }}
            transition={{ duration: 18, repeat: Infinity }}
          />
        </div>

        {/* SECTION HEADING */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="fw-bold text-center mb-5 position-relative"
          style={{
            background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "2rem",
            zIndex: 2,
          }}
        >
          Our Mission
        </motion.h2>

        {/* ICON GRID */}
        <div className="row g-4 position-relative" style={{ zIndex: 2 }}>
          {items.map((item, i) => (
            <motion.div
              key={i}
              className="col-md-4 text-center"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{
                scale: 1.05,
                filter: "drop-shadow(0 0 12px rgba(0,200,255,0.4))",
              }}
              style={{
                padding: "1.4rem",
                borderRadius: "20px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(10px)",
                transition: "0.3s ease",
              }}
            >
              <div
                style={{
                  fontSize: "2.4rem",
                  marginBottom: ".8rem",
                  background: "linear-gradient(135deg,#00c8ff,#a855f7,#00ffd0)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {item.icon}
              </div>

              <h5 className="fw-bold mb-2">{item.title}</h5>

              <p className="text-secondary fs-5">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
