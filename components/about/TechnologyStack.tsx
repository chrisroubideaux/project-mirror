// components/about/TechnologyStack.tsx
'use client';

import { motion } from "framer-motion";
import {
  SiNextdotjs,
  SiRedux,
  SiTypescript,
  SiBootstrap,
  SiFlask,
  SiPostgresql,
  SiPytorch,
  SiOpencv,
  SiHuggingface,
} from "react-icons/si";
import AuroraWave from "./AuroraWave";

export default function TechnologyStack() {
  const tech = [
    { icon: <SiNextdotjs className="social-icon" />, label: "Next.js" },
    { icon: <SiRedux className="social-icon" />, label: "Redux" },
    { icon: <SiTypescript className="social-icon" />, label: "TypeScript" },
    { icon: <SiBootstrap className="social-icon" />, label: "Bootstrap" },
    { icon: <SiFlask className="social-icon" />, label: "Flask" },
    { icon: <SiPostgresql className="social-icon" />, label: "PostgreSQL" },
    { icon: <SiPytorch className="social-icon" />, label: "PyTorch" },
    { icon: <SiOpencv className="social-icon" />, label: "OpenCV" },
    { icon: <SiHuggingface className="social-icon" />, label: "HuggingFace" },
  ];

  return (
    <section className="py-5 position-relative">
      {/* Wave behind heading */}
      <AuroraWave height={130} />

      {/* Aurora Bento Container (matching Mission + Timeline) */}
      <div
        className="mx-auto p-4 p-md-5 position-relative"
        style={{
          maxWidth: "1150px",
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

        {/* Floating glows like in the Timeline component */}
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

        {/* HEADING */}
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
          Built with Modern AI Technology
        </motion.h2>

        {/* GRID */}
        <div
          className="row g-4 text-center position-relative"
          style={{ zIndex: 2 }}
        >
          {tech.map((t, i) => (
            <motion.div
              key={i}
              className="col-6 col-md-4 col-lg-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div
                style={{
                  fontSize: "2.4rem",
                  background:
                    "linear-gradient(135deg,#00c8ff,#a855f7,#00ffd0)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {t.icon}
              </div>
              <p
                className="text-secondary fw-medium mt-2"
                style={{ fontSize: ".95rem" }}
              >
                {t.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
