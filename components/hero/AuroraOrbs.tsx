// components/hero/AuroraOrbs.tsx
'use client';

import { motion } from "framer-motion";

export default function AuroraOrbs() {
  const orbs = [
    {
      size: 180,
      top: "12%",
      left: "18%",
      color: "rgba(0, 200, 255, 0.4)",
      duration: 9,
    },
    {
      size: 140,
      top: "65%",
      left: "25%",
      color: "rgba(120, 60, 255, 0.4)",
      duration: 11,
    },
    {
      size: 220,
      top: "30%",
      right: "20%",
      color: "rgba(0, 255, 185, 0.4)",
      duration: 13,
    },
  ];

  return (
    <>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="position-absolute rounded-circle"
          animate={{ y: [0, -25, 0], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            position: "absolute",
            background: `radial-gradient(circle, ${orb.color}, transparent)`,
            top: orb.top,
            left: orb.left,
            right: orb.right,
            filter: "blur(20px)",
            zIndex: -1,
          }}
        />
      ))}
    </>
  );
}
