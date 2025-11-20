'use client';

import { motion } from "framer-motion";

export default function AuroraWave({ height = 120 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 0.33, scale: 1 }}
      viewport={{ once: true }}
      animate={{ x: [0, -60, 0] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "absolute",
        top: -height / 2,
        left: "50%",
        transform: "translateX(-50%)",
        width: "120%",
        height,
        borderRadius: "50%",
        background:
          "linear-gradient(135deg, rgba(0,200,255,0.35), rgba(160,70,255,0.33), rgba(0,255,200,0.35))",
        filter: "blur(75px)",
        zIndex: -1,
      }}
    />
  );
}
