// components/about/AuroraPhilosophy.tsx
'use client';

import { motion } from "framer-motion";
import { FaBrain, FaHeartbeat, FaRadiation } from "react-icons/fa";
import AuroraWave from "./AuroraWave";

export default function AuroraPhilosophy() {
  const items = [
    {
      icon: <FaHeartbeat className="social-icon" />,
      title: "Emotional Presence",
      desc: "Aurora reads subtle emotional signals — micro-expressions, tone, posture — to form a real-time emotional fingerprint.",
    },
    {
      icon: <FaBrain className="social-icon" />,
      title: "Neural Synergy",
      desc: "Our multimodal deep-learning pipeline merges vision, context, and behavior into one unified emotional model.",
    },
    {
      icon: <FaRadiation className="social-icon" />,
      title: "Human–AI Resonance",
      desc: "Aurora doesn't just interpret emotion — it adapts to it, creating interfaces that reflect and strengthen human connection.",
    },
  ];

  return (
    <section className="py-5 position-relative">
      {/* Aurora wave behind heading */}
      <AuroraWave height={140} />

      {/* Aurora Bento Container */}
      <div
        className="mx-auto p-4 p-md-5 position-relative"
        style={{
          maxWidth: "1050px",
          borderRadius: "28px",
          backdropFilter: "blur(18px)",
          overflow: "hidden",
          background: "var(--aurora-bento-bg)",
          border: "1px solid var(--aurora-bento-border)",
          boxShadow:
            "0 0 28px rgba(0,180,255,0.15), inset 0 0 12px rgba(255,255,255,0.05)",
        }}
      >
        {/* Soft Glow Layer */}
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

        {/* Floating haze glows */}
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
              width: "240px",
              height: "240px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(0,183,255,0.45), transparent)",
              filter: "blur(40px)",
            }}
            animate={{ opacity: [0.2, 0.5, 0.3], x: [0, 12, -8, 0] }}
            transition={{ duration: 14, repeat: Infinity }}
          />

          <motion.div
            style={{
              position: "absolute",
              top: "140px",
              right: "-40px",
              width: "240px",
              height: "240px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(168,85,247,0.45), transparent)",
              filter: "blur(40px)",
            }}
            animate={{ opacity: [0.25, 0.6, 0.35], y: [0, -15, 10, 0] }}
            transition={{ duration: 16, repeat: Infinity }}
          />
        </div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="fw-bold text-center mb-4 position-relative"
          style={{
            background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "2rem",
            zIndex: 2,
          }}
        >
          The Philosophy of Aurora
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="position-relative"
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            textAlign: "center",
            fontSize: "1.06rem",
            color: "var(--text-secondary)",
            zIndex: 2,
          }}
        >
          At Aurora, we believe that artificial intelligence should not merely
          process information — it should understand people. We design systems 
          that combine emotional depth with adaptive intelligence.
        </motion.p>

        {/* Philosophy Cards */}
        <div className="row g-4 mt-5 position-relative" style={{ zIndex: 2 }}>
          {items.map((item, i) => (
            <motion.div
              key={i}
              className="col-md-4 text-center"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              whileHover={{
                scale: 1.05,
                filter: "drop-shadow(0 0 12px rgba(0,200,255,0.4))",
              }}
              style={{
                padding: "1.5rem",
                borderRadius: "22px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
                transition: "0.3s ease",
              }}
            >
              <div
                style={{
                  fontSize: "2.6rem",
                  marginBottom: ".8rem",
                  background:
                    "linear-gradient(135deg,#00c8ff,#a855f7,#00ffd0)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {item.icon}
              </div>

              <h5 className="fw-bold mb-2">{item.title}</h5>
              <p className="text-secondary" style={{ fontSize: ".95rem" }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


{/*
'use client';

import { motion } from "framer-motion";
import { FaBrain, FaHeartbeat, FaRadiation } from "react-icons/fa";

export default function AuroraPhilosophy() {
  const items = [
    {
      icon: <FaHeartbeat  className="social-icon"/>,
      title: "Emotional Presence",
      desc: "Aurora interprets subtle shifts in facial micro-expressions, tone, and behavior to generate a real-time emotional fingerprint.",
    },
    {
      icon: <FaBrain className="social-icon" />,
      title: "Neural Synergy",
      desc: "Our multimodal deep-learning pipeline blends vision, context, and behavioral signals to form a unified emotional model.",
    },
    {
      icon: <FaRadiation className="social-icon" />,
      title: "Human-AI Resonance",
      desc: "Aurora doesn't just measure emotion — it adapts to it, creating interfaces that mirror, support, and guide the user experience.",
    },
  ];

  return (
    <section className="py-5">
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="fw-bold text-center mb-4"
          style={{
            background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          The Philosophy of Aurora
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          style={{
            maxWidth: "680px",
            margin: "0 auto",
            textAlign: "center",
            fontSize: "1.05rem",
            color: "var(--text-secondary)",
          }}
        >
          At the heart of Aurora lies the belief that technology should not just
          understand data — it should understand people. This blend of emotional
          intelligence and adaptive AI forms the foundation of meaningful interaction.
        </motion.p>

        <div className="row g-4 mt-5">
          {items.map((item, i) => (
            <motion.div
              key={i}
              className="col-md-4 text-center"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
            >
              <div
                style={{
                  fontSize: "2.6rem",
                  background: "linear-gradient(135deg,#00c8ff,#a855f7,#00ffd0)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: ".8rem",
                }}
              >
                {item.icon}
              </div>

              <h5 className="fw-bold mb-2">{item.title}</h5>
              <p className="text-secondary" style={{ fontSize: ".95rem" }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
*/}
