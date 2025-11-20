// components/about/HologramAvatar.tsx
'use client';

import { motion } from "framer-motion";
import Image from "next/image";

export default function HologramAvatar() {
  return (
    <section className="aurora-section text-center position-relative">

      {/* Hologram Glow */}
      <motion.div
        className="position-absolute top-50 start-50 translate-middle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 1.2 }}
        style={{
          width: 280,
          height: 280,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,200,255,0.3), rgba(160,70,255,0.15), transparent 70%)",
          filter: "blur(60px)",
          zIndex: -1,
        }}
      />

      {/* Main Floating Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8 } }}
        viewport={{ once: true }}
        animate={{
          y: [0, -12, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ display: "inline-block" }}
      >
        <Image
          src="/images/luna_avatar.png" // swap with your avatar img
          alt="Aurora Hologram Avatar"
          width={200}
          height={200}
          style={{
            filter:
              "drop-shadow(0 0 10px rgba(0,200,255,0.45)) drop-shadow(0 0 20px rgba(160,70,255,0.45))",
            borderRadius: "50%",
          }}
        />
      </motion.div>

      {/* Text */}
      <motion.h3
        className="fw-bold mt-4"
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.1 }}
        style={{
          background: "linear-gradient(135deg,#00b7ff,#a855f7,#00ffc8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontSize: "1.9rem",
        }}
      >
        Luna — Aurora Interface AI
      </motion.h3>

      <motion.p
        className="text-secondary mt-2"
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 }}
        style={{
          maxWidth: "620px",
          margin: "0 auto",
          fontSize: "1rem",
        }}
      >
        Luna serves as Aurora’s emotional guide — an adaptive holographic AI trained
        to read, mirror, and react to human emotional patterns in real time.
      </motion.p>
    </section>
  );
}
