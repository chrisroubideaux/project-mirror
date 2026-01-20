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
      {/* Thumbnail */}
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

        {/* Duration */}
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

      {/* Meta */}
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


   */}