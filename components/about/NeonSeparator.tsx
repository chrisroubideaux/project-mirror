// components/about/NeonSeparator.tsx
'use client';

import { motion } from "framer-motion";

export default function NeonSeparator() {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="aurora-separator"
      style={{ transformOrigin: "center" }}
    />
  );
}
