// components/emotes/GlassStatMeters.tsx
'use client';

import { motion } from "framer-motion";

interface StatProps {
  label: string;
  value: number; // range 0–1
  icon?: React.ReactNode;
}

export default function GlassStatMeters() {
  const stats = [
    {
      label: "Calm ↔ Tense",
      value: 0.72,
    },
    {
      label: "Positive ↔ Negative",
      value: 0.41,
    },
    {
      label: "Focused ↔ Distracted",
      value: 0.88,
    },
    {
      label: "Energy Level",
      value: 0.65,
    },
  ];

  return (
    <div className="container py-4" style={{ maxWidth: "700px" }}>
      {stats.map((s, i) => (
        <StatMeter key={i} label={s.label} value={s.value} />
      ))}
    </div>
  );
}

/* ============================================================
   🔹 INDIVIDUAL GLASS METER COMPONENT
   ============================================================ */
function StatMeter({ label, value }: StatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="p-3 mb-4 position-relative"
      style={{
        borderRadius: "16px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Label */}
      <div className="d-flex justify-content-between mb-2">
        <span className="fw-semibold" style={{ color: "var(--foreground)" }}>
          {label}
        </span>
        <span className="text-secondary">
          {(value * 100).toFixed(0)}%
        </span>
      </div>

      {/* Meter background */}
      <div
        style={{
          height: "12px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.12)",
          overflow: "hidden",
        }}
      >
        {/* Meter fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            height: "100%",
            borderRadius: "12px",
            background:
              "linear-gradient(90deg, #00b7ff, #a855f7, #00ffc8)",
            boxShadow: "0 0 12px rgba(0,200,255,0.45)",
          }}
        />
      </div>
    </motion.div>
  );
}
