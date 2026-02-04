// components/videos/VideoPlayer.tsx

// components/videos/VideoPlayer.tsx

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMiniPlayer } from '@/components/videos/MiniPlayerContext';

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
  const { setVideo: setMiniPlayerVideo } = useMiniPlayer();

  const [theater, setTheater] = useState(false);

  // 🔒 Lock background scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ⌨️ ESC to close → send to mini-player
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMiniPlayerVideo(video);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, setMiniPlayerVideo, video]);

  // 🔁 Reset playback when src changes
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  }, [src]);

  const handleClose = () => {
    setMiniPlayerVideo(video);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 3000,
          overflowY: 'auto',
        }}
      >
       
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: theater ? '96vw' : 1440,
            margin: theater ? '2vh auto 64px' : '4vh auto 64px',
            padding: '0 16px',
            transition: 'max-width 0.3s ease, margin 0.3s ease',
          }}
        >
         
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              maxHeight: theater ? '85vh' : '80vh',
              background: '#000',
              borderRadius: theater ? 8 : 16,
              overflow: 'hidden',
              transition:
                'border-radius 0.3s ease, max-height 0.3s ease',
            }}
          >
            <button
              onClick={() => setTheater((v) => !v)}
              aria-label="Toggle theater mode"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 5,
                background: 'rgba(0,0,0,0.65)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 8px',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {theater ? '▢' : '▣'}
            </button>

            <video
              ref={videoRef}
              src={src}
              controls
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>

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
// components/videos/VideoPlayer.tsx

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMiniPlayer } from '@/components/videos/MiniPlayerContext';

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
  const { setVideo: setMiniPlayerVideo } = useMiniPlayer();

  const [theater, setTheater] = useState(false);

  // 🔒 Lock background scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ⌨️ ESC to close → send to mini-player
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMiniPlayerVideo(video);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, setMiniPlayerVideo, video]);

  // 🔁 Reset playback when src changes
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  }, [src]);

  const handleClose = () => {
    setMiniPlayerVideo(video);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 3000,
          overflowY: 'auto',
        }}
      >
       
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: theater ? '96vw' : 1440,
            margin: theater ? '2vh auto 64px' : '4vh auto 64px',
            padding: '0 16px',
            transition: 'max-width 0.3s ease, margin 0.3s ease',
          }}
        >
         
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              maxHeight: theater ? '85vh' : '80vh',
              background: '#000',
              borderRadius: theater ? 8 : 16,
              overflow: 'hidden',
              transition:
                'border-radius 0.3s ease, max-height 0.3s ease',
            }}
          >
            <button
              onClick={() => setTheater((v) => !v)}
              aria-label="Toggle theater mode"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 5,
                background: 'rgba(0,0,0,0.65)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 8px',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {theater ? '▢' : '▣'}
            </button>

            <video
              ref={videoRef}
              src={src}
              controls
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>

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



*/}
