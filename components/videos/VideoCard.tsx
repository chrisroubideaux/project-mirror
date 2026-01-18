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

export default function VideoCard({
  video,
}: {
  video: PublicVideo;
}) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/videos/${video.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          router.push(`/videos/${video.id}`);
        }
      }}
      style={{
        cursor: 'pointer',
        color: 'inherit',
        width: '100%',
      }}
    >
      <div
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid var(--aurora-bento-border)',
          background: 'var(--aurora-bento-bg)',
        }}
      >
        {/* Thumbnail */}
        <div style={{ position: 'relative' }}>
          <img
            src={video.poster_url || '/placeholder.jpg'}
            alt={video.title}
            loading="lazy"
            style={{
              width: '100%',
              height: 180,
              objectFit: 'cover',
              display: 'block',
            }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: 10,
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.55)',
              fontSize: 12,
            }}
          >
            ▶ {video.duration ?? '—'}
          </div>
        </div>

        {/* Meta */}
        <div className="p-3">
          <div className="fw-semibold">{video.title}</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            {video.subtitle ?? video.type}
          </div>
        </div>
      </div>
    </div>
  );
}
