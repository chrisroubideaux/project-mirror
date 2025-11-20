// components/about/AboutIntro.tsx

'use client';

import { motion } from 'framer-motion';

export default function AboutIntro() {
  return (
    <section className="text-center py-5 mb-5">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fw-bold"
        style={{
          fontSize: "2.8rem",
          background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        About Project Aurora
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-secondary mt-3"
        style={{ maxWidth: "650px", margin: "0 auto", fontSize: "1.05rem" }}
      >
        Project Aurora blends real-time emotion recognition, adaptive interfaces, and
        AI-powered insights into a unified experience. Built on deep learning, modern
        web frameworks, and human-centered design, Aurora bridges technology and empathy.
      </motion.p>
    </section>
  );
}
