// components/guest/AuroraTimeline.tsx
'use client';

import { motion } from "framer-motion";
import {
  FaCamera,
  FaBrain,
  FaChartPie,
  FaEye,
  FaInfinity,
  FaCircle,
} from "react-icons/fa";

export default function AuroraTimeline() {
  /* ============================================================
     TOP FEATURE LIST (formerly 4-card grid)
     ============================================================ */
  const steps = [
    {
      title: "Scan",
      icon: <FaCamera className="social-icon" />,
      desc:
        "Aurora begins with a passive scan, capturing subtle emotional indicators through micro-expressions and facial cues.",
    },
    {
      title: "Analyze",
      icon: <FaBrain className="social-icon" />,
      desc:
        "Multimodal AI processes emotional signals using deep neural analysis, detecting patterns invisible to the human eye.",
    },
    {
      title: "Visualize",
      icon: <FaChartPie className="social-icon" />,
      desc:
        "Your emotional state becomes a real-time map — a dynamic spectrum of valence, arousal, and affective signals.",
    },
    {
      title: "Reflect",
      icon: <FaEye className="social-icon" />,
      desc:
        "Aurora mirrors emotional shifts back to you with meaningful insights, helping you understand your internal landscape.",
    },
  ];

  /* ============================================================
     LOWER PIPELINE — TECHNICAL AI FLOW
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
        "Results appear through adaptive visual layers, gradients, and clear UI reflections.",
    },
    {
      label: "Adapt",
      desc:
        "Aurora updates continuously, learning from moment-to-moment emotional shifts.",
    },
  ];

  return (
    <div className="container my-5" style={{ maxWidth: "900px" }}>
      {/* ===========================
          NEW TOP SECTION (vertical list)
         =========================== */}
      <h3
        className="fw-bold text-center mb-4"
        style={{
          background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        How Aurora Understands You
      </h3>

      <div className="mb-5">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="d-flex align-items-start mb-4"
            style={{ gap: "16px" }}
          >
            {/* Gradient Icon */}
            <div
              style={{
                fontSize: "2rem",
                background: "linear-gradient(135deg, #00c8ff, #a855f7, #00ffd0)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 6px rgba(0,180,255,0.35))",
              }}
            >
              {s.icon}
            </div>

            {/* Text */}
            <div>
              <h5
                className="fw-bold mb-1"
                style={{
                  background:
                    "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {s.title}
              </h5>
              <p className="text-secondary" style={{ fontSize: "0.92rem" }}>
                {s.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ===========================
          LOWER TECHNICAL PIPELINE
         =========================== */}
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
        {/* Aurora Glow Line */}
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
  FaInfinity,
  FaCircle,
} from "react-icons/fa";

export default function AuroraTimeline() {

  const steps = [
    {
      title: "Scan",
      icon: <FaCamera />,
      desc: "Aurora begins with a passive scan, capturing subtle emotional indicators through micro-expressions and facial cues.",
    },
    {
      title: "Analyze",
      icon: <FaBrain />,
      desc: "Multimodal AI processes emotional signals with deep neural inference, extracting patterns invisible to the human eye.",
    },
    {
      title: "Visualize",
      icon: <FaChartPie />,
      desc: "Your emotional state becomes a visual map — a dynamic spectrum of valence, arousal, and affective signals.",
    },
    {
      title: "Reflect",
      icon: <FaEye />,
      desc: "Aurora mirrors emotional shifts back to you with meaningful insights, helping you understand your internal landscape.",
    },
  ];

  const pipeline = [
    {
      label: "Capture",
      desc:
        "Raw emotional input is collected — frame data, micro-movements, and facial tension states.",
    },
    {
      label: "Decode",
      desc:
        "The system deciphers affective signatures using multimodal neural decoding engines.",
    },
    {
      label: "Map",
      desc:
        "Aurora translates emotional intensity and polarity onto a 2D affective map (valence × arousal).",
    },
    {
      label: "Present",
      desc:
        "Results appear through clean visual layers, gradients, and adaptive UI reflections.",
    },
    {
      label: "Adapt",
      desc:
        "Aurora adjusts in real time, reshaping responses based on continuous emotional feedback.",
    },
  ];

  return (
    <div className="container my-5" style={{ maxWidth: "900px" }}>
     
      <h3
        className="fw-bold text-center mb-4"
        style={{
          background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        How Aurora Understands You
      </h3>

      <div className="row g-4 mb-5">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="col-6 col-md-3 text-center"
          >
          
            <div
              style={{
                fontSize: "2.4rem",
                background: "linear-gradient(135deg, #00c8ff, #a855f7, #00ffd0)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 6px rgba(0,180,255,0.35))",
              }}
              className="mb-2"
            >
              {s.icon}
            </div>
        
            <h5
              className="fw-bold mb-2"
              style={{
                background:
                  "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {s.title}
            </h5>

          
            <p className="text-secondary" style={{ fontSize: "0.92rem" }}>
              {s.desc}
            </p>
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
