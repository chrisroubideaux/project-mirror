// components/about/AuroraParticleField.tsx
'use client';

import { motion } from "framer-motion";

export default function AuroraParticleField() {
  const particles = Array.from({ length: 35 });

  return (
    <div
      className="position-absolute top-0 start-0 w-100 h-100"
      style={{
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      {particles.map((_, i) => {
        const size = Math.random() * 5 + 2;
        const startX = Math.random() * 100;
        const driftX = startX + (Math.random() * 20 - 10); // horizontal drift
        const startY = Math.random() * 100;

        return (
          <motion.span
            key={i}
            initial={{
              opacity: 0.15,
              scale: 0.8,
              x: `${startX}%`,
              y: `${startY}%`,
            }}
            animate={{
              opacity: [0.15, 0.5, 0.15],
              scale: [0.9, 1.3, 0.9],
              x: [`${startX}%`, `${driftX}%`, `${startX}%`],
              y: [`${startY}%`, `${startY - 50}%`, `${startY}%`],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: "50%",
              background: "rgba(0,255,200,0.8)",
              filter: "blur(2px)",
            }}
          />
        );
      })}
    </div>
  );
}
