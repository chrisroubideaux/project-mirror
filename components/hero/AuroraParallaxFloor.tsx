// components/hero/AuroraParallaxFloor.tsx
'use client';

import { motion, useViewportScroll, useTransform } from "framer-motion";

export default function AuroraParallaxFloor() {
  const { scrollY } = useViewportScroll();

  const translateY = useTransform(scrollY, [0, 500], [0, -40]);

  return (
    <motion.div
      style={{
        position: "absolute",
        bottom: "-40px",
        left: 0,
        right: 0,
        height: "240px",
        translateY,
        background:
          "radial-gradient(circle at 50% 20%, rgba(0,200,255,0.4), rgba(0,255,200,0.2), transparent 70%)",
        filter: "blur(60px)",
        opacity: 0.7,
        pointerEvents: "none",
      }}
    />
  );
}
