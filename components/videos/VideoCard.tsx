// components/videos/VideoCard.tsx
'use client';

export type PublicVideo = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  poster_url: string;
  video_url: string;
  duration?: string | null;
  aspect_ratio?: string | null;
  type: string;
  visibility: string;
  created_at: string;
};

export default function VideoCard({
  video,
  onPlay,
}: {
  video: PublicVideo;
  onPlay: (v: PublicVideo) => void;
}) {
  return (
    <button
      type="button"
      className="text-start border-0 p-0 bg-transparent w-100"
      onClick={() => onPlay(video)}
      style={{ color: 'inherit' }}
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
            src={video.poster_url}
            alt={video.title}
            style={{ width: '100%', height: 180, objectFit: 'cover' }}
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
    </button>
  );
}
