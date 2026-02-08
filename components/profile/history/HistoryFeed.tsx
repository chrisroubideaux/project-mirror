// components/profile/history/HistoryFeed.tsx

'use client';

import { useEffect, useState } from 'react';
import VideoCard, {
  type ProfileVideo,
} from '@/components/profile/videos/VideoCard';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

const TOKEN_KEY = 'aurora_user_token';

type Props = {
  userId: string;
};

export default function HistoryFeed({ userId }: Props) {
  const [videos, setVideos] = useState<ProfileVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token || !userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/videos/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to fetch history');
        }

        const data = (await res.json()) as ProfileVideo[];

        if (!cancelled) {
          setVideos(data);
        }
      } catch (err) {
        console.error('❌ Failed to load history:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  /* -----------------------------
     Loading
  ----------------------------- */
  if (loading) {
    return null;
  }

  /* -----------------------------
     Empty state
  ----------------------------- */
  if (videos.length === 0) {
    return (
      <div
        style={{
          padding: 48,
          textAlign: 'center',
          opacity: 0.6,
        }}
      >
        <h4 className="fw-light mb-2">
          No watch history yet
        </h4>
        <p className="mb-0">
          Videos you watch will appear here
        </p>
      </div>
    );
  }

  /* -----------------------------
     History grid
  ----------------------------- */
  return (
    <div>
      <h5 className="fw-light mb-4">History</h5>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
        }}
      >
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
          />
        ))}
      </div>
    </div>
  );
}
