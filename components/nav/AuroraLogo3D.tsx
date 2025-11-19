// components/nav/AuroraLogo3D.tsx
'use client';

import { motion } from "framer-motion";
import Image from "next/image";

export default function AuroraLogo3D() {
    function gradient(colors: string | string[], x: number = 50, y: number = 50, spread: number = 100): string {
      const stops = Array.isArray(colors)
        ? colors
        : (typeof colors === "string" && colors.trim().length ? [colors] : []);

      const safeStops = stops.length
        ? stops
        : [
            "rgba(0,200,255,0.55)",
            "rgba(150,70,255,0.35)",
            "rgba(0,255,200,0)",
          ];

      const clamp = (v: number) => Math.max(0, Math.min(100, v));
      const clampedX = clamp(x);
      const clampedY = clamp(y);
      const clampedSpread = clamp(spread);

      const n = safeStops.length;
      const parts = safeStops.map((c, i) => {
        if (n === 1) return `${c} 0%`;
        const pct = Math.round((i / (n - 1)) * clampedSpread);
        return `${c} ${pct}%`;
      });

      if (clampedSpread < 100) {
        parts.push(`transparent 100%`);
      }

      return `radial-gradient(circle at ${clampedX}% ${clampedY}%, ${parts.join(", ")})`;
    }

  return (
    <motion.div
      className="position-relative"
      style={{
        width: "54px",
        height: "54px",
        cursor: "pointer",
      }}
      whileHover={{
        scale: 1.15,
      }}
    >
      {/* 🌈 Pulsing Neon Aura */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,200,255,0.55), rgba(150,70,255,0.35), rgba(0,255,200,0))",
          filter: "blur(18px)",
          zIndex: 0,
        }}
        animate={{
          opacity: [0.55, 0.9, 0.55],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 🔥 Rotating Neon Ring */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "2px solid transparent",
          background:
            "conic-gradient(from 0deg, #00eaff, #a855f7, #00ffd5, #00eaff)",
          WebkitMask:
            "linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          opacity: 0.7,
          zIndex: 1,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* ✨ TINY ORBITING SPARKS */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, #ffffff, rgba(255,255,255,0.2))",
            boxShadow: "0 0 8px rgba(0,255,255,0.8)",
            zIndex: 2,
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 4 + i * 0.8, // each spark orbits at a slightly different speed
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <motion.div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              top: "-26px",
            }}
            animate={{
              scale: [1, 1.6, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      ))}

      {/* ⭐ Center Logo */}
      <motion.div
        style={{
          position: "absolute",
          inset: "8px",
          borderRadius: "50%",
          zIndex: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
        animate={{
          rotateZ: [0, 2, -2, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
      >
        <Image
          src="/logo/logo.png"
          alt="Aurora Logo"
          width={40}
          height={40}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </motion.div>
    </motion.div>
  );
}




{/*
'use client';

import { motion } from "framer-motion";
import Image from "next/image";

export default function AuroraLogo3D() {
    function gradient(colors: string | string[], x: number = 50, y: number = 50, spread: number = 100): string {
      const stops = Array.isArray(colors)
        ? colors
        : (typeof colors === "string" && colors.trim().length ? [colors] : []);
  
      const safeStops = stops.length > 0
        ? stops
        : [
            "rgba(0,200,255,0.55)",
            "rgba(150,70,255,0.35)",
            "rgba(0,255,200,0)",
          ];
  
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));
      const clampedSpread = Math.max(0, Math.min(100, spread));
  
      const n = safeStops.length;
      const parts = safeStops.map((c, i) => {
        if (n === 1) return `${c} 0%`;
        const pct = Math.round((i / (n - 1)) * clampedSpread);
        return `${c} ${pct}%`;
      });
  
      if (clampedSpread < 100) {
        parts.push(`transparent 100%`);
      }
  
      return `radial-gradient(circle at ${clampedX}% ${clampedY}%, ${parts.join(", ")})`;
    }

  return (
    <motion.div
      className="position-relative"
      style={{
        width: "52px",
        height: "52px",
        cursor: "pointer",
      }}
      whileHover={{
        scale: 1.15,
      }}
    >
    
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,200,255,0.55), rgba(150,70,255,0.35), rgba(0,255,200,0))",
          filter: "blur(18px)",
          zIndex: 0,
        }}
        animate={{
          opacity: [0.55, 0.9, 0.55],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

   
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "2px solid transparent",
          background:
            "conic-gradient(from 0deg, #00eaff, #a855f7, #00ffd5, #00eaff)",
          WebkitMask:
            "linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          opacity: 0.7,
          zIndex: 1,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

    
      <motion.div
        style={{
          position: "absolute",
          inset: "6px",
          borderRadius: "50%",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
        animate={{
          rotateZ: [0, 2, -2, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
      >
        <Image
          src="/logo/logo.png" // your transparent logo
          alt="Aurora Logo"
          width={60}
          height={60}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

*/}
