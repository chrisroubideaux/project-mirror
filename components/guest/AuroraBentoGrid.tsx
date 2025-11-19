// components/guest/AuroraBentoGrid.tsx
'use client';

import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  FaBrain,
  FaRobot,
  FaMagic,
  FaEye,
  FaChartLine,
  FaUserAstronaut,
} from "react-icons/fa";

/* ============================================================
   BENTO GRID CONTAINER
   ============================================================ */
export default function AuroraBentoGrid() {
  const items = [
    {
      title: "Real-Time Emotion Detection",
      description:
        "Aurora analyzes micro-expressions in milliseconds using deep neural vision.",
      icon: <FaBrain  className="social-icon"/>,
      size: "large",
    },
    {
      title: "Multimodal AI Processing",
      description:
        "Text, audio, facial signals, and behavioral context fused into one model.",
      icon: <FaRobot className="social-icon" />,
      size: "tall",
    },
    {
      title: "Valence & Arousal Modeling",
      description:
        "Emotional intensity and positivity mapped into a dynamic affective state.",
      icon: <FaMagic className="social-icon" />,
      size: "small",
    },
    {
      title: "Mirror System Interface",
      description:
        "Aurora reflects emotional states through a clean, adaptive UI system.",
      icon: <FaEye className="social-icon" />,
      size: "wide",
    },
    {
      title: "Aurora Insights",
      description:
        "Daily summaries of emotional patterns, trends, and behavioral signals.",
      icon: <FaChartLine className="social-icon" />,
      size: "small",
    },
    {
      title: "Avatar Emotion Mirroring",
      description:
        "Your avatar mirrors your emotional presence — no camera required.",
      icon: <FaUserAstronaut className="social-icon" />,
      size: "square",
    },
  ];

  return (
    <div
      className="mx-auto my-5"
      style={{
        maxWidth: "1100px",
        display: "grid",
        gap: "20px",
        gridTemplateAreas: `
          "large large tall"
          "wide small tall"
          "wide small square"
        `,
        gridTemplateColumns: "1fr 1fr 1fr",
      }}
    >
      {items.map((item, i) => (
        <BentoCard key={i} {...item} index={i} />
      ))}
    </div>
  );
}

/* ============================================================
   🔹 SINGLE BENTO CARD (with gradient icon fix)
   ============================================================ */
function BentoCard({
  title,
  description,
  icon,
  size,
  index,
}: {
  title: string;
  description: string;
  icon: any;
  size: string;
  index: number;
}) {
  const area = {
    large: "large",
    small: "small",
    wide: "wide",
    tall: "tall",
    square: "square",
  }[size];

  // Magnetic tilt interaction
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-75, 75], [10, -10]);
  const rotateY = useTransform(x, [-75, 75], [-10, 10]);

  const onMove = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - (rect.left + rect.width / 2));
    y.set(e.clientY - (rect.top + rect.height / 2));
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        gridArea: area,
        rotateX,
        rotateY,
        perspective: 800,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ scale: 1.04 }}
        transition={{
          duration: 0.6,
          delay: index * 0.05,
        }}
        className="p-4 h-100 position-relative text-center shadow-sm"
        style={{
          borderRadius: "22px",
          padding: "2rem",
          cursor: "pointer",
          backdropFilter: "blur(16px)",
          overflow: "hidden",

          /* Visible border in BOTH light + dark mode */
          border: "1.5px solid rgba(120,120,120,0.35)",

          background: "rgba(255,255,255,0.06)",
        }}
      >
        {/* AURORA GLOW BACKDROP */}
        <motion.div
          animate={{ opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 5, repeat: Infinity }}
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: "22px",
            background:
              "linear-gradient(135deg, rgba(0,200,255,0.4), rgba(150,70,255,0.4), rgba(0,255,200,0.4))",
            filter: "blur(45px)",
            zIndex: -1,
          }}
        />

        {/* 🔥 TRUE GRADIENT ICON FIX */}
        <motion.div
          animate={{
            opacity: [1, 0.85, 1],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ marginBottom: ".8rem" }}
        >
          <span
            style={{
              display: "inline-block",
              fontSize: "2.8rem",

              /* gradient applied to mask */
              background: "linear-gradient(135deg, #00c8ff, #a855f7, #00ffd0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",

              /* 🔑 This makes SVG icons adopt the gradient */
              WebkitMaskImage: "linear-gradient(white, white)",
              maskImage: "linear-gradient(white, white)",

              filter: "drop-shadow(0 0 8px rgba(0,180,255,0.35))",
            }}
          >
            {icon}
          </span>
        </motion.div>

        {/* TITLE */}
        <h4
          className="fw-bold mb-2"
          style={{
            fontSize: "1.2rem",
            background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {title}
        </h4>

        {/* DESCRIPTION */}
        <p
          className="text-secondary"
          style={{
            fontSize: ".92rem",
            lineHeight: "1.4rem",
          }}
        >
          {description}
        </p>
      </motion.div>
    </motion.div>
  );
}




{/*


'use client';

import { motion } from "framer-motion";
import {
  FaBrain,
  FaRobot,
  FaMagic,
  FaEye,
  FaChartLine,
  FaUserAstronaut,
} from "react-icons/fa";

export default function AuroraBentoGrid() {
  const items = [
    {
      title: "Real-Time Emotion Detection",
      icon: <FaBrain />,
      size: "large",
    },
    {
      title: "Multimodal AI Processing",
      icon: <FaRobot />,
      size: "tall",
    },
    {
      title: "Valence & Arousal Modeling",
      icon: <FaMagic />,
      size: "small",
    },
    {
      title: "Mirror System Interface",
      icon: <FaEye />,
      size: "wide",
    },
    {
      title: "Aurora Insights",
      icon: <FaChartLine />,
      size: "small",
    },
    {
      title: "Avatar Emotion Mirroring",
      icon: <FaUserAstronaut />,
      size: "square",
    },
  ];

  return (
    <div
      className="mx-auto my-5"
      style={{
        maxWidth: "1100px",
        display: "grid",
        gap: "20px",
        gridTemplateAreas: `
          "large large tall"
          "wide small tall"
          "wide small square"
        `,
        gridTemplateColumns: "1fr 1fr 1fr",
      }}
    >
      {items.map((item, i) => (
        <BentoCard key={i} {...item} />
      ))}
    </div>
  );
}

function BentoCard({
  title,
  icon,
  size,
}: {
  title: string;
  icon: any;
  size: string;
}) {
  const area = {
    large: "large",
    small: "small",
    wide: "wide",
    tall: "tall",
    square: "square",
  }[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.03 }}
      style={{
        gridArea: area,
        borderRadius: "22px",
        padding: "1.8rem",
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(14px)",
        cursor: "pointer",
      }}
      className="position-relative text-center"
    >
      <div
        style={{
          fontSize: "2rem",
          marginBottom: "1rem",
          background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {icon}
      </div>

      <h5
        className="fw-bold"
        style={{
          background: "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {title}
      </h5>
    </motion.div>
  );
}

*/}
