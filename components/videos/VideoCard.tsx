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
  series_avatar_url?: string | null;
  view_count?: number;
  progress?: number;
};

export default function VideoCard({ video }: { video: PublicVideo }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [hovered, setHovered] = useState(false);

  // 🔒 Prevent double view fires
  const hasRegisteredViewRef = useRef(false);

  const registerView = () => {
    if (hasRegisteredViewRef.current) return;
    hasRegisteredViewRef.current = true;

    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000'}/api/videos/${video.id}/view`,
      { method: 'POST' }
    ).catch(() => {});
  };

  const handleMouseEnter = () => {
    setHovered(true);

    const v = videoRef.current;
    if (!v) return;

    v.currentTime = 0;
    v.play()
      .then(() => {
        // 🎯 Meaningful playback starts here
        registerView();
      })
      .catch(() => {});
  };

  const handleMouseLeave = () => {
    setHovered(false);

    const v = videoRef.current;
    if (!v) return;

    v.pause();
    v.currentTime = 0;
  };

  const uploadDate = new Date(video.created_at);
  const timeAgo = `${Math.max(
    1,
    Math.floor(
      (Date.now() - uploadDate.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  )}d ago`;

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
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      style={{
        width: 300,
        cursor: 'pointer',
        borderRadius: 16,
        transition:
          'transform 0.25s ease, box-shadow 0.25s ease',
        transform: hovered ? 'translateY(-6px)' : 'none',
        boxShadow: hovered
          ? '0 18px 40px rgba(0,0,0,0.45)'
          : '0 6px 18px rgba(0,0,0,0.25)',
        background: 'transparent',
      }}
    >
      {/* THUMBNAIL / PREVIEW */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 16,
          overflow: 'hidden',
          background: '#000',
        }}
      >
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

        {/* GRADIENT */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))',
            pointerEvents: 'none',
          }}
        />

        {/* PLAY ICON */}
        {!hovered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                color: '#fff',
              }}
            >
              ▶
            </div>
          </div>
        )}

        {/* TYPE BADGE */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            padding: '4px 8px',
            fontSize: 11,
            borderRadius: 6,
            background: 'rgba(0,0,0,0.65)',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {video.type}
        </div>

        {/* DURATION */}
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

        {/* CONTINUE WATCHING BAR */}
        {typeof video.progress === 'number' && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: 4,
              width: '100%',
              background: 'rgba(255,255,255,0.2)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(
                  100,
                  Math.max(0, video.progress * 100)
                )}%`,
                background: '#00e0ff',
              }}
            />
          </div>
        )}
      </div>

      {/* META */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 12 }}>
        {video.series_avatar_url ? (
          <img
            src={video.series_avatar_url}
            alt="Series avatar"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
            }}
          >
            {video.title.charAt(0)}
          </div>
        )}

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {video.title}
          </div>
          <div style={{ fontSize: 12, opacity: 0.65 }}>
            {video.subtitle ?? video.type}
          </div>
          <div style={{ fontSize: 11, opacity: 0.5 }}>
            {(video.view_count ?? 0).toLocaleString()} views • {timeAgo}
          </div>
        </div>
      </div>
    </article>
  );
}


{/*
// components/videos/VideoCard.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';

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

  // NEW
  series_avatar_url?: string | null;

  // OPTIONAL COSMETIC FIELDS
  view_count?: number;
  progress?: number; // 0 → 1
};

export default function VideoCard({ video }: { video: PublicVideo }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hovered, setHovered] = useState(false);

useEffect(() => {
  fetch(
    `http://localhost:5000/api/videos/${video.id}/view`,
    { method: 'POST' }
  ).catch(() => {});
}, [video.id]);


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

  const uploadDate = new Date(video.created_at);
  const timeAgo = `${Math.max(
    1,
    Math.floor(
      (Date.now() - uploadDate.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  )}d ago`;

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
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      style={{
        width: 300,
        cursor: 'pointer',
        borderRadius: 16,
        transition:
          'transform 0.25s ease, box-shadow 0.25s ease',
        transform: hovered ? 'translateY(-6px)' : 'none',
        boxShadow: hovered
          ? '0 18px 40px rgba(0,0,0,0.45)'
          : '0 6px 18px rgba(0,0,0,0.25)',
        background: 'transparent',
      }}
    >
     
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 16,
          overflow: 'hidden',
          background: '#000',
        }}
      >
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

       
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))',
            pointerEvents: 'none',
          }}
        />

       
        {!hovered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                color: '#fff',
              }}
            >
              ▶
            </div>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            padding: '4px 8px',
            fontSize: 11,
            borderRadius: 6,
            background: 'rgba(0,0,0,0.65)',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {video.type}
        </div>

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

       
        {typeof video.progress === 'number' && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: 4,
              width: '100%',
              background: 'rgba(255,255,255,0.2)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(
                  100,
                  Math.max(0, video.progress * 100)
                )}%`,
                background: '#00e0ff',
              }}
            />
          </div>
        )}
      </div>

      
      <div
        style={{
          display: 'flex',
          gap: 10,
          paddingTop: 12,
        }}
      >
      
        {video.series_avatar_url ? (
          <img
            src={video.series_avatar_url}
            alt="Series avatar"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {video.title.charAt(0)}
          </div>
        )}

       
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              lineHeight: 1.35,
              marginBottom: 4,
            }}
          >
            {video.title}
          </div>

          <div
            style={{
              fontSize: 12,
              opacity: 0.65,
            }}
          >
            {video.subtitle ?? video.type}
          </div>

          <div
            style={{
              fontSize: 11,
              opacity: 0.5,
              marginTop: 2,
            }}
          >
            {(video.view_count ?? 0).toLocaleString()} views •{' '}
            {timeAgo}
          </div>
        </div>
      </div>
    </article>
  );
}



*/}