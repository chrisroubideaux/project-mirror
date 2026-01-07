// components/avatar/AuroraAvatar.tsx

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlay, FaTimes } from "react-icons/fa";

type AuroraAvatarProps = {
  title: string;
  subtitle?: string;
  poster: string;
  videoSrc: string;
  duration?: string; // e.g. "0:42"
};

export default function AuroraAvatar({
  title,
  subtitle,
  poster,
  videoSrc,
  duration = "0:42",
}: AuroraAvatarProps) {
  const [open, setOpen] = useState(false);

  /* ESC + scroll lock */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* ============================= */}
      {/* VIDEO CARD (THUMBNAIL)        */}
      {/* ============================= */}

      <motion.article
        className="aurora-video-card"
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
      >
        {/* THUMBNAIL */}
        <div className="aurora-video-thumb">
          <img src={poster} alt={title} />

          {/* INTRO TAG */}
          <span className="aurora-video-tag">INTRO</span>

          {/* DURATION */}
          <span className="aurora-video-duration">{duration}</span>

          {/* PLAY OVERLAY */}
          <div className="aurora-video-overlay">
            <FaPlay className="aurora-video-play" />
          </div>
        </div>

        {/* META */}
        <div className="aurora-video-meta">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </motion.article>

      {/* ============================= */}
      {/* MODAL VIDEO PLAYER            */}
      {/* ============================= */}

      <AnimatePresence>
        {open && (
          <motion.div
            className="aurora-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="aurora-modal"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="aurora-modal-close"
                onClick={() => setOpen(false)}
                aria-label="Close video"
              >
                <FaTimes />
              </button>

              <video
                src={videoSrc}
                controls
                autoPlay
                playsInline
                className="aurora-modal-video"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
