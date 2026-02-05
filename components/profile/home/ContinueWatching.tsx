// components/profile/home/ContinueWatching.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

type ContinueVideo = {
  id: string;
  title: string;
  poster_url: string;
  progress: number; // 0 → 1 (mocked for now)
};

export default function ContinueWatching() {
  const router = useRouter();

  const [video, setVideo] = useState<ContinueVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token =
          localStorage.getItem('aurora_user_token');

        if (!token) return;

        const res = await fetch(
          `${API_BASE}/api/videos/member`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) return;

        const videos = (await res.json()) as any[];

        const first = videos[0];
        if (!first) return;

        setVideo({
          id: first.id,
          title: first.title,
          poster_url: first.poster_url,
          progress: 0.42, // placeholder until real progress API
        });
      } catch (err) {
        console.error(
          'Failed to load Continue Watching',
          err
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !video) {
    return null;
  }

  const handleResume = () => {
   router.push(`/profile/videos/${video.id}`);

  };

  return (
    <div
      className="p-4 rounded-4"
      style={{
        background: 'var(--aurora-bento-bg)',
        border: '1px solid var(--aurora-bento-border)',
        cursor: 'pointer',
      }}
      onClick={handleResume}
    >
      <h5 className="fw-light mb-3">Continue Watching</h5>

      <div className="d-flex gap-3 align-items-center">
        <img
          src={video.poster_url}
          alt={video.title}
          style={{
            width: 220,
            height: 120,
            borderRadius: 12,
            objectFit: 'cover',
          }}
        />

        <div className="flex-grow-1">
          <div className="fw-semibold">
            {video.title}
          </div>

          <div className="small text-muted mb-2">
            {Math.round(video.progress * 100)}% watched
          </div>

          <div
            style={{
              height: 4,
              width: '100%',
              background: '#333',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${video.progress * 100}%`,
                height: '100%',
                background: 'var(--accent)',
              }}
            />
          </div>
        </div>
      </div>
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

type ContinueVideo = PublicVideo & {
  progress: number; // 0 → 1 (mocked for now)
};

export default function ContinueWatching() {
  const router = useRouter();

  const [video, setVideo] = useState<ContinueVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token =
          localStorage.getItem('aurora_user_token');

        if (!token) return;

        const res = await fetch(
          `${API_BASE}/api/videos/member`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) return;

        const videos = (await res.json()) as PublicVideo[];

        // 🚧 TEMP heuristic:
        // pick the first video as "continue watching"
        // (replace later with real progress API)
        const first = videos[0];
        if (!first) return;

        setVideo({
          ...first,
          progress: 0.42, // placeholder until progress table exists
        });
      } catch (err) {
        console.error(
          'Failed to load Continue Watching',
          err
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !video) {
    return null;
  }

  const handleResume = () => {
    router.push(`/videos/${video.id}`);
  };

  return (
    <div
      className="p-4 rounded-4"
      style={{
        background: 'var(--aurora-bento-bg)',
        border: '1px solid var(--aurora-bento-border)',
        cursor: 'pointer',
      }}
      onClick={handleResume}
    >
      <h5 className="fw-light mb-3">Continue Watching</h5>
      <div className="d-flex gap-3 align-items-center">
        <img
          src={video.poster_url}
          alt={video.title}
          style={{
            width: 220,
            height: 120,
            borderRadius: 12,
            objectFit: 'cover',
          }}
        />

        <div className="flex-grow-1">
          <div className="fw-semibold">
            {video.title}
          </div>

          <div className="small text-muted mb-2">
            {Math.round(video.progress * 100)}% watched
          </div>

          <div
            style={{
              height: 4,
              width: '100%',
              background: '#333',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${video.progress * 100}%`,
                height: '100%',
                background: 'var(--accent)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

*/}