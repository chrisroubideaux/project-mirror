// components/about/AboutHero.tsx
'use client';

import { motion } from "framer-motion";
import AuroraWave from "./AuroraWave";
import ParallaxWrapper from "./ParallaxWrapper";

export default function AboutHero() {
  return (
    <section
      className="aurora-section position-relative text-center"
      style={{
        overflow: "hidden",
        paddingTop: "6rem",
        paddingBottom: "6rem",
        background: `
          linear-gradient(135deg,
            rgba(0,183,255,0.20),
            rgba(168,85,247,0.20),
            rgba(0,255,200,0.20)
          ),
          radial-gradient(circle at 20% 30%, rgba(0,200,255,0.35), transparent 60%),
          radial-gradient(circle at 80% 70%, rgba(160,70,255,0.35), transparent 60%)
        `,
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Aurora glow wave */}
      <AuroraWave height={170} />

      {/* Title with Parallax */}
      <ParallaxWrapper offset={30}>
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="fw-bold mb-3"
          style={{
            fontSize: "3.2rem",
            lineHeight: "1.15",
            background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            position: "relative",
            zIndex: 2,
          }}
        >
          Understanding Human Emotion  
          <br />
          Through Intelligent AI Design
        </motion.h1>
      </ParallaxWrapper>

      {/* Accent separator */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: "140px", opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        style={{
          height: "4px",
          margin: "0 auto",
          borderRadius: "15px",
          background: "linear-gradient(90deg, #00c8ff, #a855f7, #00ffd0)",
        }}
      />

      {/* Subtitle text */}
      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.35 }}
        className=" mt-4"
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          fontSize: "1.5rem",
          zIndex: 3,
          position: "relative",
        }}
      >
        Aurora blends neuroscience, emotional intelligence, and advanced
        machine learning to build interfaces that understand — and respond to —
        human emotion in real time.
      </motion.p>
    </section>
  );
}


