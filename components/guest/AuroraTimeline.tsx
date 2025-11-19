// components/guest/AuroraTimeline.tsx
'use client';

import { motion } from "framer-motion";
import { useState } from "react";
import {
  FaCamera,
  FaBrain,
  FaChartPie,
  FaEye,
  FaCircle,
} from "react-icons/fa";

export default function AuroraTimeline() {
  /* ============================================================
     TOP FEATURE LIST (Scan → Analyze → Visualize → Reflect)
     ============================================================ */
  const steps = [
    {
      title: "Scan",
      icon: <FaCamera />,
      desc:
        "Aurora begins with a passive scan, capturing subtle emotional indicators through micro-expressions and facial cues.",
      orbColor: "rgba(0,180,255,0.28)",
    },
    {
      title: "Analyze",
      icon: <FaBrain />,
      desc:
        "Multimodal AI processes emotional signals using deep neural inference, detecting patterns invisible to the human eye.",
      orbColor: "rgba(168,85,247,0.30)",
    },
    {
      title: "Visualize",
      icon: <FaChartPie />,
      desc:
        "Your emotional state becomes a mapped spectrum — valence, arousal, and affective gradients rendered visually.",
      orbColor: "rgba(0,255,200,0.30)",
    },
    {
      title: "Reflect",
      icon: <FaEye />,
      desc:
        "Aurora mirrors emotional shifts with meaningful insights, helping you understand your internal emotional landscape.",
      orbColor: "rgba(255,255,255,0.20)",
    },
  ];

  /* ============================================================
     LOWER PIPELINE — Technical AI flow
     ============================================================ */
  const pipeline = [
    {
      label: "Capture",
      desc:
        "Raw emotional input is collected: frame data, micro-movements, and facial tension patterns.",
    },
    {
      label: "Decode",
      desc:
        "Affective signatures are decoded using multimodal neural engines designed for emotional inference.",
    },
    {
      label: "Map",
      desc:
        "Aurora plots emotional intensity and polarity on a 2D affective plane (valence × arousal).",
    },
    {
      label: "Present",
      desc:
        "Results appear through adaptive visual layers, gradients, and clean UI reflections.",
    },
    {
      label: "Adapt",
      desc:
        "Aurora updates continuously, learning from moment-to-moment emotional shifts.",
    },
  ];

  /* ============================================================
     STATE: Which step is currently "active" (hovered)
     ============================================================ */
  const [activeStep, setActiveStep] = useState<number | null>(null);

  // Neural path variants for interactive reroute
  const neuralPaths = [
    // baseline
    `M 40 20 
     C 140 90,  -40 160,  40 240 
     S 140 330, 40 410`,
    // slightly tighter curvature near top
    `M 40 20
     C 100 80,  0 180,  40 240
     S 120 320, 40 410`,
    // more sway in the middle
    `M 40 20
     C 160 90, -60 190,  40 250
     S 160 320, 40 410`,
    // more drift near bottom
    `M 40 20
     C 130 80, -40 160,  40 240
     S 80 340, 40 410`,
  ];

  const currentPath =
    activeStep == null ? neuralPaths[0] : neuralPaths[activeStep];

  /* ============================================================
     AVATAR STATES — reacting to active top step
     ============================================================ */
  const avatarStates = [
    {
      label: "Listening",
      emoji: "👁️",
      text: "Aurora is quietly observing your emotional signals.",
    },
    {
      label: "Processing",
      emoji: "🧠",
      text: "Neural layers are decoding your emotional state.",
    },
    {
      label: "Mapping",
      emoji: "📊",
      text: "Your emotions are being translated into a visual spectrum.",
    },
    {
      label: "Reflecting",
      emoji: "✨",
      text: "Aurora is reflecting your inner state back to you.",
    },
  ];

  const defaultAvatar = {
    label: "Idle",
    emoji: "🌙",
    text: "Aurora is in a calm standby, ready when you are.",
  };

  const avatar =
    activeStep == null ? defaultAvatar : avatarStates[activeStep];

  return (
    <div className="container my-5 position-relative" style={{ maxWidth: "950px" }}>
      {/* ===========================
          AURORA SMOKE BACKGROUND
         =========================== */}
      <div
        style={{
          position: "absolute",
          inset: "-40px 0 0 0",
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            position: "absolute",
            top: "-60px",
            left: "-40px",
            width: "260px",
            height: "260px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at center, rgba(0,183,255,0.55), rgba(0,0,0,0))",
            filter: "blur(35px)",
          }}
          animate={{ opacity: [0.2, 0.6, 0.3], x: [0, 20, -10, 0] }}
          transition={{ duration: 14, repeat: Infinity }}
        />
        <motion.div
          style={{
            position: "absolute",
            top: "120px",
            right: "-50px",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at center, rgba(168,85,247,0.55), rgba(0,0,0,0))",
            filter: "blur(40px)",
          }}
          animate={{ opacity: [0.25, 0.7, 0.4], y: [0, -20, 10, 0] }}
          transition={{ duration: 16, repeat: Infinity }}
        />
        <motion.div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "10%",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at center, rgba(0,255,200,0.45), rgba(0,0,0,0))",
            filter: "blur(50px)",
          }}
          animate={{ opacity: [0.15, 0.5, 0.25], x: [0, -15, 10, 0] }}
          transition={{ duration: 18, repeat: Infinity }}
        />
      </div>

      {/* ===========================
          HEADER + AVATAR
         =========================== */}
      <div className="d-flex justify-content-between align-items-start mb-4 position-relative" style={{ zIndex: 2 }}>
        <h3
          className="fw-bold mb-0"
          style={{
            background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          How Aurora Understands You
        </h3>

        {/* Reacting avatar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          animate={{ opacity: 1 }}
          className="text-end"
          style={{ zIndex: 2 }}
        >
          <div
            className="d-inline-flex align-items-center gap-2 p-2 px-3"
            style={{
              borderRadius: "999px",
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
              backdropFilter: "blur(14px)",
            }}
          >
            <motion.div
              animate={{ scale: activeStep == null ? 1 : [1, 1.08, 1] }}
              transition={{
                duration: 0.9,
                repeat: activeStep == null ? 0 : Infinity,
                repeatDelay: 1.5,
              }}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                background:
                  "radial-gradient(circle at 30% 30%, #ffffff, #00b7ff)",
                boxShadow: "0 0 12px rgba(0,200,255,0.5)",
              }}
            >
              {avatar.emoji}
            </motion.div>
            <div style={{ maxWidth: "220px" }}>
              <div className="fw-semibold" style={{ fontSize: "0.82rem" }}>
                Aurora: {avatar.label}
              </div>
              <div
                className="text-secondary"
                style={{ fontSize: "0.75rem", lineHeight: "1rem" }}
              >
                {avatar.text}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ===========================
          TOP STEPS + INTERACTIVE NEURAL PATH
         =========================== */}
      <div className="position-relative mb-5" style={{ zIndex: 2 }}>
        {/* Neural reroute curve */}
        <motion.svg
          width="100%"
          height="420"
          style={{
            position: "absolute",
            left: "30px",
            top: "0",
            overflow: "visible",
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <motion.path
            d={currentPath}
            stroke="url(#neuralGradient)"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            animate={{
              strokeDashoffset: [260, 0],
              opacity: activeStep == null ? 0.7 : 1,
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
            strokeDasharray="260"
          />

          {/* subtle glow path */}
          <motion.path
            d={currentPath}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={7}
            fill="none"
            strokeLinecap="round"
            style={{ filter: "blur(6px)" }}
            animate={{
              opacity: activeStep == null ? 0.25 : 0.45,
            }}
            transition={{ duration: 0.6 }}
          />

          <defs>
            <linearGradient id="neuralGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00b7ff" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#00ffc8" />
            </linearGradient>
          </defs>
        </motion.svg>

        {/* Step list */}
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.18 }}
            onMouseEnter={() => setActiveStep(i)}
            onMouseLeave={() => setActiveStep((prev) => (prev === i ? null : prev))}
            className="d-flex align-items-start mb-5 position-relative"
            style={{ gap: "18px" }}
          >
            {/* Glowing step number */}
            <motion.div
              animate={{
                scale: activeStep === i ? [1, 1.08, 1] : 1,
              }}
              transition={{
                duration: 0.9,
                repeat: activeStep === i ? Infinity : 0,
                repeatDelay: 1.4,
              }}
              style={{
                fontSize: "1.6rem",
                fontWeight: 900,
                minWidth: "48px",
                height: "48px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
                color: "#fff",
                boxShadow:
                  activeStep === i
                    ? "0 0 18px rgba(0,200,255,0.7)"
                    : "0 0 10px rgba(0,200,255,0.4)",
              }}
            >
              {i + 1}
            </motion.div>

            {/* Soft orb illustration behind step */}
            <motion.div
              style={{
                position: "absolute",
                left: "10px",
                top: "-24px",
                width: "130px",
                height: "130px",
                borderRadius: "50%",
                background: s.orbColor,
                filter: "blur(52px)",
                zIndex: -1,
              }}
              animate={{
                opacity: activeStep === i ? [0.45, 0.7, 0.45] : [0.25, 0.4, 0.25],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
              }}
            />

            {/* Step content */}
            <div>
              <h4
                className="fw-bold mb-1"
                style={{
                  background:
                    "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {s.title}
              </h4>

              <div className="d-flex" style={{ gap: "10px" }}>
                <div
                  style={{
                    fontSize: "1.8rem",
                    background:
                      "linear-gradient(135deg, #00c8ff, #a855f7, #00ffd0)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 6px rgba(0,200,255,0.4))",
                  }}
                >
                  {s.icon}
                </div>

                <p
                  className="text-secondary"
                  style={{
                    fontSize: "0.92rem",
                    lineHeight: "1.4rem",
                    maxWidth: "550px",
                  }}
                >
                  {s.desc}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ============================================================
          LOWER PIPELINE
         ============================================================ */}
      <h4
        className="fw-bold mb-4 position-relative"
        style={{
          background: "linear-gradient(135deg, #00ffc8, #a855f7, #00b7ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          zIndex: 2,
        }}
      >
        Aurora Processing Pipeline
      </h4>

      <div className="position-relative ps-4" style={{ zIndex: 2 }}>
        {/* Vertical glow line */}
        <div
          style={{
            position: "absolute",
            left: "10px",
            top: 0,
            bottom: 0,
            width: "3px",
            background:
              "linear-gradient(180deg, #00b7ff, #a855f7, #00ffc8)",
            borderRadius: "3px",
            boxShadow: "0 0 12px rgba(0,200,255,0.4)",
          }}
        />

        {pipeline.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className="mb-4"
          >
            <div className="d-flex align-items-center">
              <FaCircle
                style={{
                  color: "#00ffc8",
                  marginRight: "12px",
                  filter: "drop-shadow(0 0 6px rgba(0,255,200,0.6))",
                }}
              />
              <h6 className="fw-bold">{step.label}</h6>
            </div>

            <p
              className="text-secondary ps-4"
              style={{ fontSize: "0.92rem", lineHeight: "1.4rem" }}
            >
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}



{/*
// components/guest/AuroraTimeline.tsx
'use client';

import { motion } from "framer-motion";
import {
  FaCamera,
  FaBrain,
  FaChartPie,
  FaEye,
  FaCircle,
} from "react-icons/fa";

export default function AuroraTimeline() {
 
  const steps = [
    {
      title: "Scan",
      icon: <FaCamera />,
      desc:
        "Aurora begins with a passive scan, capturing subtle emotional indicators through micro-expressions and facial cues.",
      orbColor: "rgba(0,180,255,0.25)",
    },
    {
      title: "Analyze",
      icon: <FaBrain />,
      desc:
        "Multimodal AI processes emotional signals using deep neural inference, detecting patterns invisible to the human eye.",
      orbColor: "rgba(168,85,247,0.25)",
    },
    {
      title: "Visualize",
      icon: <FaChartPie />,
      desc:
        "Your emotional state becomes a mapped spectrum — valence, arousal, and affective gradients rendered visually.",
      orbColor: "rgba(0,255,200,0.25)",
    },
    {
      title: "Reflect",
      icon: <FaEye />,
      desc:
        "Aurora mirrors emotional shifts with meaningful insights, helping you understand your internal emotional landscape.",
      orbColor: "rgba(255,255,255,0.18)",
    },
  ];

  const pipeline = [
    {
      label: "Capture",
      desc:
        "Raw emotional input is collected: frame data, micro-movements, and facial tension patterns.",
    },
    {
      label: "Decode",
      desc:
        "Affective signatures are decoded using multimodal neural engines designed for emotional inference.",
    },
    {
      label: "Map",
      desc:
        "Aurora plots emotional intensity and polarity on a 2D affective plane (valence × arousal).",
    },
    {
      label: "Present",
      desc:
        "Results appear through adaptive visual layers, gradients, and clean UI reflections.",
    },
    {
      label: "Adapt",
      desc:
        "Aurora updates continuously, learning from moment-to-moment emotional shifts.",
    },
  ];

  return (
    <div className="container my-5" style={{ maxWidth: "900px" }}>
     
      <h3
        className="fw-bold text-center mb-5"
        style={{
          background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        How Aurora Understands You
      </h3>

      <div className="position-relative">
        <motion.svg
          width="100%"
          height="420"
          style={{
            position: "absolute",
            left: "30px",
            top: "0",
            overflow: "visible",
            zIndex: 0,
          }}
        >
          <motion.path
            d="
              M 40 20 
              C 140 90,  -40 160,  40 240 
              S 140 330, 40 410
            "
            stroke="url(#neuralGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            animate={{
              strokeDashoffset: [300, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
            strokeDasharray="300"
          />

          <defs>
            <linearGradient id="neuralGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00b7ff" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#00ffc8" />
            </linearGradient>
          </defs>
        </motion.svg>

        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.18 }}
            className="d-flex align-items-start mb-5 position-relative"
            style={{ gap: "18px", zIndex: 2 }}
          >
            <div
              style={{
                fontSize: "1.6rem",
                fontWeight: "900",
                minWidth: "48px",
                height: "48px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
                color: "#fff",
                boxShadow: "0 0 15px rgba(0,200,255,0.45)",
              }}
            >
              {i + 1}
            </div>

            <motion.div
              style={{
                position: "absolute",
                left: "10px",
                top: "-20px",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: s.orbColor,
                filter: "blur(50px)",
                zIndex: -1,
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
              }}
            />

            <div>
              <h4
                className="fw-bold mb-1"
                style={{
                  background:
                    "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {s.title}
              </h4>

              <div className="d-flex" style={{ gap: "10px" }}>
                <div
                  style={{
                    fontSize: "1.8rem",
                    background:
                      "linear-gradient(135deg, #00c8ff, #a855f7, #00ffd0)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 6px rgba(0,200,255,0.4))",
                  }}
                >
                  {s.icon}
                </div>

                <p
                  className="text-secondary"
                  style={{
                    fontSize: "0.92rem",
                    lineHeight: "1.4rem",
                    maxWidth: "550px",
                  }}
                >
                  {s.desc}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <h4
        className="fw-bold mb-4"
        style={{
          background: "linear-gradient(135deg, #00ffc8, #a855f7, #00b7ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Aurora Processing Pipeline
      </h4>

      <div className="position-relative ps-4">
      
        <div
          style={{
            position: "absolute",
            left: "10px",
            top: 0,
            bottom: 0,
            width: "3px",
            background:
              "linear-gradient(180deg, #00b7ff, #a855f7, #00ffc8)",
            borderRadius: "3px",
            boxShadow: "0 0 12px rgba(0,200,255,0.4)",
          }}
        />

        {pipeline.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className="mb-4"
          >
            <div className="d-flex align-items-center">
              <FaCircle
                style={{
                  color: "#00ffc8",
                  marginRight: "12px",
                  filter: "drop-shadow(0 0 6px rgba(0,255,200,0.6))",
                }}
              />
              <h6 className="fw-bold">{step.label}</h6>
            </div>

            <p
              className="text-secondary ps-4"
              style={{ fontSize: "0.92rem", lineHeight: "1.4rem" }}
            >
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}




*/}
