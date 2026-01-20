// components/videos/VideoCard.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export type PublicVideo = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  poster_url: string;
  video_url?: string;
  duration?: string | null;
  aspect_ratio?: string | null;
  type: string;
  visibility: string;
  created_at: string;
};

export default function VideoCard({ video }: { video: PublicVideo }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    setHovered(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/videos/${video.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          router.push(`/videos/${video.id}`);
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: 300,
        cursor: 'pointer',
        transition: 'transform .2s ease, box-shadow .2s ease',
      }}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {/* THUMBNAIL / PREVIEW */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 14,
          overflow: 'hidden',
          background: '#000',
        }}
      >
        {/* POSTER IMAGE */}
        {!hovered && (
          <img
            src={video.poster_url}
            alt={video.title}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}

        {/* HOVER PREVIEW VIDEO */}
        {hovered && video.video_url && (
          <video
            ref={videoRef}
            src={video.video_url}
            muted
            playsInline
            preload="metadata"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}

        {/* DURATION BADGE */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            padding: '4px 8px',
            fontSize: 12,
            borderRadius: 6,
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
          }}
        >
          {video.duration ?? '—'}
        </div>
      </div>

      {/* META */}
      <div style={{ paddingTop: 10 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 1.3,
            marginBottom: 4,
          }}
        >
          {video.title}
        </div>

        <div style={{ fontSize: 12, opacity: 0.65 }}>
          {video.subtitle ?? video.type}
        </div>
      </div>
    </article>
  );
}


{/*
// components/videos/VideoCard.tsx
'use client';

import { useRouter } from 'next/navigation';

export type PublicVideo = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  poster_url: string;
  duration?: string | null;
  aspect_ratio?: string | null;
  type: string;
  visibility: string;
  created_at: string;
};

export default function VideoCard({ video }: { video: PublicVideo }) {
  const router = useRouter();

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/videos/${video.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          router.push(`/videos/${video.id}`);
        }
      }}
      style={{
        width: 300,
        cursor: 'pointer',
        transition: 'transform .2s ease, box-shadow .2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
     
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 14,
          overflow: 'hidden',
          background: '#000',
        }}
      >
        <img
          src={video.poster_url || '/placeholder.jpg'}
          alt={video.title}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

     
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            padding: '4px 8px',
            fontSize: 12,
            borderRadius: 6,
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
          }}
        >
          {video.duration ?? '—'}
        </div>
      </div>

    
      <div style={{ paddingTop: 10 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 1.3,
            marginBottom: 4,
          }}
        >
          {video.title}
        </div>

        <div style={{ fontSize: 12, opacity: 0.65 }}>
          {video.subtitle ?? video.type}
        </div>
      </div>
    </article>
  );
}



   */}