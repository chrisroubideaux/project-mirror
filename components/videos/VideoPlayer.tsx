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

  // Lock scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Reset playback on src change
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
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 3000,
          overflowY: 'auto',
        }}
      >
        {/* CONTENT WRAPPER */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: 1440,
            margin: '4vh auto 64px',
            padding: '0 16px',
          }}
        >
          {/* PLAYER FRAME */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxHeight: '80vh',           // 🔑 viewport-aware
              aspectRatio: '16 / 9',
              background: '#000',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <video
              ref={videoRef}
              src={src}
              controls
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',       // 🔑 prevents cropping
                display: 'block',
              }}
            />
          </div>

          {/* META (YOUTUBE STYLE) */}
          <div
            style={{
              marginTop: 18,
              paddingLeft: 4,
            }}
          >
            <h1
              style={{
                fontSize: 20,
                fontWeight: 600,
                lineHeight: 1.35,
                marginBottom: 6,
              }}
            >
              {video.title}
            </h1>

            {video.subtitle && (
              <div
                style={{
                  fontSize: 14,
                  opacity: 0.65,
                }}
              >
                {video.subtitle}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


{/*

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
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 3000,
          overflowY: 'auto',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: 1280,
            margin: '5vh auto 40px',
            padding: '0 16px',
          }}
        >
         
          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              background: '#000',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <video
              ref={videoRef}
              src={src}
              controls
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
              }}
            />
          </div>

         
          <div style={{ marginTop: 16 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600 }}>
              {video.title}
            </h1>

            {video.subtitle && (
              <div style={{ fontSize: 14, opacity: 0.65 }}>
                {video.subtitle}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

   */}
