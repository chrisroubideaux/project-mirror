// components/profile/home/FeaturedTrailer.tsx
'use client';

import { useEffect, useState } from 'react';
import VideoCard, {
  type PublicVideo,
} from '@/components/videos/VideoCard';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

export default function FeaturedTrailer() {
  const [video, setVideo] = useState<PublicVideo | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/videos`);
        if (!res.ok) return;

        const videos = (await res.json()) as PublicVideo[];

        // Public API already returns trailers only
        if (videos.length > 0) {
          setVideo(videos[0]);
        }
      } catch (err) {
        console.error('Failed to load featured trailer', err);
      }
    })();
  }, []);

  if (!video) return null;

  return (
    <div>
      <h5 className="fw-light mb-3">Featured</h5>

      {/* EXACT SAME CARD AS PUBLIC GRID */}
      <VideoCard video={video} />
    </div>
  );
}


{/*
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PublicVideo } from '@/components/videos/VideoCard';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

export default function FeaturedTrailer() {
  const router = useRouter();
  const [video, setVideo] = useState<PublicVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/videos`);
        if (!res.ok) return;

        const videos = (await res.json()) as PublicVideo[];

        // 🔒 Public API already returns trailers only,
        // but we still defensively filter
        const trailer = videos.find(
          (v) => v.type === 'trailer'
        );

        if (trailer) {
          setVideo(trailer);
        }
      } catch (err) {
        console.error('Failed to load featured trailer', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !video) {
    return (
      <div
        className="rounded-4"
        style={{
          height: 320,
          background: '#111',
          border: '1px solid var(--aurora-bento-border)',
        }}
      />
    );
  }

  return (
    <div
      className="rounded-4 overflow-hidden position-relative"
      style={{
        height: 320,
        background: '#000',
        border: '1px solid var(--aurora-bento-border)',
        cursor: 'pointer',
      }}
      onClick={() => router.push(`/videos/${video.id}`)}
    >
     
      <img
        src={video.poster_url}
        alt={video.title}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

    
      <div
        className="position-absolute bottom-0 start-0 w-100 p-4"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
        }}
      >
        <h3 className="fw-light mb-1">
          {video.title}
        </h3>

        {video.subtitle && (
          <p className="mb-2 small">
            {video.subtitle}
          </p>
        )}

        <button className="btn btn-sm btn-primary">
          ▶ Watch Trailer
        </button>
      </div>
    </div>
  );
}
*/}