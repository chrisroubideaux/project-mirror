// components/videos/VideoPlayer.tsx

'use client';

import { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type PlaybackVideo = {
  id: string;
  title: string;
  subtitle?: string | null;
  video_url: string;
  type?: string;
};

export default function VideoPlayer({
  video,
  onClose,
}: {
  video: PlaybackVideo;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const src = useMemo(() => video.video_url, [video.video_url]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  }, [src]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{
          background: 'rgba(0,0,0,0.7)',
          zIndex: 3000,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(1100px, 95vw)',
            background: '#000',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 12, borderBottom: '1px solid #222' }}>
            <strong>{video.title}</strong>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {video.subtitle}
            </div>
          </div>

          <div style={{ aspectRatio: '16 / 9' }}>
            <video
              ref={videoRef}
              src={src}
              controls
              muted
              playsInline
              autoPlay
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

