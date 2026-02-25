// components/hero/AuroraHero.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuroraIntroPresence from "@/components/avatar/intro/AuroraIntroPresence";

export default function AuroraHero() {
  const [showIntro, setShowIntro] = useState(false);
  const [index, setIndex] = useState(0);

  // 🔥 Gradient Placeholder Slides
  const slides = [
    "linear-gradient(135deg, #001f3f, #0074D9, #00b7ff)",
    "linear-gradient(135deg, #1a002b, #6610f2, #a855f7)",
    "linear-gradient(135deg, #002b36, #00ffc8, #00b894)",
    "linear-gradient(135deg, #000814, #001d3d, #003566)",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <>
      {/* ============================= */}
      {/* HERO WRAPPER                 */}
      {/* ============================= */}
      <div
        className="position-relative overflow-hidden d-flex align-items-center justify-content-center"
        style={{
          height: "100vh",
          zIndex: 0, // 🔥 ensures hero never blocks navbar
        }}
      >
        {/* ============================= */}
        {/* BACKGROUND SLIDER            */}
        {/* ============================= */}
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: 0,
              background: slides[index],
              backgroundSize: "200% 200%",
              zIndex: -2, // 🔥 safely behind everything
            }}
          />
        </AnimatePresence>

        {/* Dark Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.75))",
            zIndex: -1,
          }}
        />

        {/* ============================= */}
        {/* HERO CONTENT                 */}
        {/* ============================= */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center px-4"
          style={{
            maxWidth: "700px",
            color: "white",
            zIndex: 1, // 🔥 sits above overlay but below navbar
          }}
        >
          <motion.h1
            className="display-3 fw-bold mb-3"
            style={{
              background:
                "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Project AURORA
          </motion.h1>

          <motion.p
            className="lead mb-4 fs-5"
            style={{ opacity: 0.9 }}
          >
            A next-generation Emotion Recognition & Empathy Engine —
            fusing AI, machine learning, behavioral psychology, and
            multimodal deep learning into one intelligent emotional system.
          </motion.p>

          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <button
              onClick={() => setShowIntro(true)}
              className="btn px-4 py-2 fw-semibold"
              style={{
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg, #007bff, #6610f2)",
                color: "white",
                border: "none",
                boxShadow: "0 0 18px rgba(0,123,255,0.4)",
              }}
            >
              Meet Aurora
            </button>

            <a
              href="/about"
              className="btn btn-outline-light px-4 py-2 fw-semibold"
              style={{
                borderRadius: "14px",
                backdropFilter: "blur(4px)",
              }}
            >
              Learn More
            </a>
          </div>
        </motion.div>
      </div>

      {/* ============================= */}
      {/* FULLSCREEN INTRO MODAL        */}
      {/* ============================= */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "black",
              zIndex: 10000, // 🔥 above everything
            }}
          >
            <button
              onClick={() => setShowIntro(false)}
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                zIndex: 11000,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "50%",
                width: 42,
                height: 42,
                color: "white",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            <AuroraIntroPresence />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

{/*

// components/hero/AuroraHero.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuroraIntroPresence from "@/components/avatar/intro/AuroraIntroPresence";

export default function AuroraHero() {
  const [showIntro, setShowIntro] = useState(false);

  return (
    <>
      <div
        className="position-relative overflow-hidden d-flex align-items-center justify-content-center"
        style={{
          height: "70vh",
          backdropFilter: "blur(12px)",
        }}
      >
       
        <motion.div
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(0,180,255,0.45), rgba(160,70,255,0.45), rgba(0,255,200,0.35))",
            backgroundSize: "200% 200%",
            filter: "blur(80px)",
            zIndex: -1,
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center px-4"
          style={{
            maxWidth: "650px",
            color: "var(--foreground)",
          }}
        >
          <motion.h1
            className="display-3 fw-bold mb-3 display-4"
            style={{
              background:
                "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Project AURORA
          </motion.h1>

          <motion.p
            className="lead mb-4 fs-4"
            style={{ opacity: 0.85 }}
          >
            A next-generation Emotion Recognition & Empathy Engine —
            fusing AI, machine learning, behavioral psychology, and multimodal deep learning into one intelligent emotional system.
          </motion.p>

          <div className="d-flex justify-content-center gap-3">
            <button
              onClick={() => setShowIntro(true)}
              className="btn px-4 py-2 fw-semibold"
              style={{
                borderRadius: "14px",
                background: "linear-gradient(135deg, #007bff, #6610f2)",
                color: "white",
                border: "none",
                boxShadow: "0 0 15px rgba(0,123,255,0.3)",
              }}
            >
              Meet Aurora
            </button>

            <a
              href="/about"
              className="btn btn-outline-light px-4 py-2 fw-semibold"
              style={{ borderRadius: "14px" }}
            >
              Learn More
            </a>
          </div>
        </motion.div>
      </div>

    
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "black",
              zIndex: 9999,
            }}
          >
           
            <button
              onClick={() => setShowIntro(false)}
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                zIndex: 10000,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "50%",
                width: 42,
                height: 42,
                color: "white",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            <AuroraIntroPresence />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}




*/}