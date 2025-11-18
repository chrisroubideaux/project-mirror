// components/hero/AuroraHero.tsx
'use client';

import { motion } from "framer-motion";

export default function AuroraHero() {
  return (
    <div
      className="position-relative overflow-hidden d-flex align-items-center justify-content-center"
      style={{
        height: "70vh",
        backdropFilter: "blur(12px)",
      }}
    >

      {/* --- AURORA BACKGROUND SHIMMER --- */}
      <motion.div
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(0,180,255,0.45), rgba(160,70,255,0.45), rgba(0,255,200,0.35))",
          backgroundSize: "200% 200%",
          filter: "blur(80px)",
          zIndex: -1,
        }}
      />

      {/* --- FLOATING SHAPES --- */}
      <motion.div
        className="position-absolute rounded-circle"
        animate={{ y: [0, -25, 0], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 6, repeat: Infinity }}
        style={{
          width: 180,
          height: 180,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.2), transparent)",
          top: "12%",
          left: "20%",
          filter: "blur(18px)",
          zIndex: -1,
        }}
      />

      <motion.div
        className="position-absolute rounded-circle"
        animate={{ y: [0, 30, 0], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 7, repeat: Infinity }}
        style={{
          width: 150,
          height: 150,
          background:
            "radial-gradient(circle, rgba(180,120,255,0.25), transparent)",
          bottom: "14%",
          right: "18%",
          filter: "blur(22px)",
          zIndex: -1,
        }}
      />

      {/* --- CENTER CONTENT --- */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center px-4"
        style={{
          maxWidth: "650px",
          color: "var(--foreground)",
        }}
      >

        {/* TITLE */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.9 }}
          className="display-3 fw-bold mb-3"
          style={{
            background:
              "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Project AURORA
        </motion.h1>

        {/* TAGLINE */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.9 }}
          className="lead mb-4"
          style={{
            color: "var(--foreground)",
            opacity: 0.85,
          }}
        >
          Emotion Recognition & Empathy Engine — Powered by AI, Psychology, and Multimodal Deep Learning.
        </motion.p>

        {/* BUTTONS */}
        <motion.div
          className="d-flex justify-content-center gap-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.9 }}
        >
          <a
            href="/emotes"
            className="btn px-4 py-2 fw-semibold"
            style={{
              borderRadius: "14px",
              background: "linear-gradient(135deg, #007bff, #6610f2)",
              color: "white",
              border: "none",
              boxShadow: "0 0 15px rgba(0,123,255,0.3)",
            }}
          >
            Start Emotion Scan
          </a>

          <a
            href="/about"
            className="btn btn-outline-light px-4 py-2 fw-semibold"
            style={{
              borderRadius: "14px",
              backdropFilter: "blur(6px)",
            }}
          >
            Learn More
          </a>
        </motion.div>
      </motion.div>

    </div>
  );
}
