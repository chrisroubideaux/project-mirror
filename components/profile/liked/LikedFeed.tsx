// components/profile/liked/LikedFeed.tsx
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

export default function LikedFeed({ userId }: Props) {
  const [videos, setVideos] = useState<ProfileVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/videos/liked`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to load liked videos');

        const data = await res.json();
        if (!cancelled) setVideos(data);
      } catch (err) {
        console.error('❌ Failed to load liked videos:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) return null;

  if (videos.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', opacity: 0.6 }}>
        <h4 className="fw-light mb-2">No liked videos yet</h4>
        <p className="mb-0">Tap the heart on a video to save it here</p>
      </div>
    );
  }

  return (
    <div>
      <h5 className="fw-light mb-4">Liked Videos</h5>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
        }}
      >
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
