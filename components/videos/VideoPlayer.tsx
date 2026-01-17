// components/videos/VideoPlayer.tsx
// components/videos/VideoPlayer.tsx
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* --------------------------------------------------
   Playback-only type
-------------------------------------------------- */
export type PlaybackVideo = {
  id?: string;
  title: string;
  subtitle?: string | null;
  video_url: string;
  type?: string;
};

/* --------------------------------------------------
   Component
-------------------------------------------------- */
export default function VideoPlayer({
  video,
  onClose,
}: {
  video: PlaybackVideo;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const src = useMemo(() => video.video_url.trim(), [video.video_url]);

  /* --------------------------------------------------
     Lock background scroll
  -------------------------------------------------- */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* --------------------------------------------------
     ESC key
  -------------------------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* --------------------------------------------------
     Reset playback on src change
  -------------------------------------------------- */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  }, [src]);

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(10px)',
          zIndex: 2500,
          padding: 16,
        }}
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(1100px, 96vw)',
            borderRadius: 20,
            overflow: 'hidden',
            background: '#000',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
          }}
        >
          {/* Header */}
          <div
            className="d-flex align-items-center justify-content-between px-3 py-2"
            style={{
              background: '#0b0b0b',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div>
              <div className="fw-semibold">{video.title}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {video.subtitle ?? video.type}
              </div>
            </div>

            <button
              className="btn btn-sm btn-outline-light"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          {/* Video Wrapper */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              background: '#000',
            }}
          >
            <video
              ref={videoRef}
              src={src}
              controls
              muted
              playsInline
              preload="auto"
              onLoadedMetadata={() => {
                const v = videoRef.current;
                if (!v) return;
                v.muted = true;
                v.play().catch(() => {});
              }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#000',
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

