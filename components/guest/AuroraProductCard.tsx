// components/guest/AuroraProductCard.tsx

'use client';

import { motion } from "framer-motion";
import { FaStar } from "react-icons/fa";

export default function AuroraProductCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mx-auto my-5 p-5 text-center position-relative"
      style={{
        maxWidth: "850px",
        borderRadius: "28px",
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.15)",
        overflow: "hidden",
      }}
    >
      {/* Aurora Glow Backdrop */}
      <motion.div
        animate={{ opacity: [0.25, 0.6, 0.25] }}
        transition={{ duration: 6, repeat: Infinity }}
        style={{
          position: "absolute",
          inset: -50,
          borderRadius: "28px",
          background:
            "linear-gradient(135deg, rgba(0,180,255,0.5), rgba(150,70,255,0.4), rgba(0,255,200,0.5))",
          filter: "blur(80px)",
          zIndex: -1,
        }}
      />

      {/* Icon */}
      <motion.div
        animate={{
          opacity: [1, 0.9, 1],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{
          fontSize: "3.5rem",
          marginBottom: "1rem",
          background: "linear-gradient(135deg, #00c8ff, #a855f7, #00ffd0)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        <FaStar className="social-icon" />
      </motion.div>

      <h1
        className="fw-bold mb-3"
        style={{
          background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Meet AURORA
      </h1>

      <p className="text-secondary fs-5 mx-auto fs-3" style={{ maxWidth: "620px" }}>
        A next-generation Emotion Intelligence Engine that reads, interprets, and
        visualizes human emotion using advanced multimodal AI, psychology, and
        adaptive modeling.
      </p>

      {/* Button */}
      <button
        disabled
        className="btn btn-outline-light mt-4 px-4 py-2"
        style={{
          borderRadius: "12px",
          opacity: 0.6,
          cursor: "not-allowed",
        }}
      >
        Login to experience Aurora →
      </button>
    </motion.div>
  );
}
