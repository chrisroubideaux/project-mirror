// components/videos/MiniPlayer.tsx
'use client';

import { useMiniPlayer } from './MiniPlayerContext';
import { useRef, useState } from 'react';

export default function MiniPlayer() {
  const { video, setVideo } = useMiniPlayer();
  const dragging = useRef(false);

  // Distance from bottom-right corner
  const [pos, setPos] = useState({ x: 20, y: 20 });

  if (!video) return null;

  return (
    <div
      onPointerDown={() => (dragging.current = true)}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
      onPointerMove={(e) => {
        if (!dragging.current) return;

        setPos({
          x: Math.max(12, window.innerWidth - e.clientX - 160),
          y: Math.max(12, window.innerHeight - e.clientY - 90),
        });
      }}
      style={{
        position: 'fixed',
        bottom: pos.y,
        right: pos.x,
        width: 320,
        aspectRatio: '16 / 9',
        background: '#000',
        borderRadius: 12,
        overflow: 'hidden',
        zIndex: 5000,
        cursor: dragging.current ? 'grabbing' : 'grab',
        boxShadow: '0 14px 40px rgba(0,0,0,0.45)',
      }}
    >
      {/* VIDEO */}
      <video
        src={video.video_url}
        autoPlay
        controls
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />

      {/* CLOSE BUTTON */}
      <button
        onClick={() => setVideo(null)}
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          padding: '2px 6px',
          cursor: 'pointer',
          fontSize: 12,
        }}
        aria-label="Close mini player"
      >
        ✕
      </button>
    </div>
  );
}
