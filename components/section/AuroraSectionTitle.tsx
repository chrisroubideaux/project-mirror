// components/section/AuroraSectionTitle.tsx
'use client';

import { motion } from 'framer-motion';

export default function AuroraSectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center mb-5"
    >
      <h2
        className="fw-bold"
        style={{
          fontSize: "2.6rem",
          background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {title}
      </h2>

      {subtitle && (
        <p className="text-secondary mt-2" style={{ fontSize: "1.05rem" }}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
