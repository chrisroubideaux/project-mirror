// page/profle/videos/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import VideoPlayer from '@/components/profile/videos/VideoPlayer';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

const TOKEN_KEY = 'aurora_user_token';

type Video = {
  id: string;
  title: string;
  description?: string | null;
  video_url: string;
  view_count?: number;
  like_count?: number;
};

export default function ProfileVideoPage() {
  const router = useRouter();
  const params = useParams();

  // ✅ SINGLE PARAM — matches /profile/videos/[id]
  const videoId = params?.id as string | undefined;

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------------------------------------
     Auth + Video Fetch (MEMBER)
  --------------------------------------------- */
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token || !videoId) {
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/videos/member/${videoId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error('Video not found or unauthorized');
        }

        const data = await res.json();
        setVideo(data);
      } catch (err) {
        console.error('❌ Failed to load video:', err);
        router.back(); // 👈 return user to previous page (profile)
      } finally {
        setLoading(false);
      }
    })();
  }, [videoId, router]);

  /* ---------------------------------------------
     Loading / Guard
  --------------------------------------------- */
  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        Loading…
      </div>
    );
  }

  if (!video) return null;

  /* ---------------------------------------------
     Watch Page (NO SIDEBAR)
  --------------------------------------------- */
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'var(--app-bg)',
        padding: 24,
      }}
    >
      {/* 🔙 Back to profile */}
      <button
        onClick={() => router.back()}
        style={{
          marginBottom: 16,
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        ← Back
      </button>

      <VideoPlayer video={video} />
    </div>
  );
}

