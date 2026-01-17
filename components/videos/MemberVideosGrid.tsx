// components/videos/MemberVideosGrid.tsx
'use client';

import { useEffect, useState } from 'react';
import VideoCard, { type PublicVideo } from './VideoCard';
import VideoPlayer from './VideoPlayer';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const TOKEN_KEY = 'aurora_user_token';

export default function MemberVideosGrid() {
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<PublicVideo | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem(TOKEN_KEY)
        : null;

    (async () => {
      try {
        if (!token) {
          setErr('No user token found.');
          return;
        }

        const res = await fetch(`${API_BASE}/api/videos/member`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Unauthorized (${res.status})`);

        const data = (await res.json()) as PublicVideo[];
        setVideos(data);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-3">Loading member videos…</div>;

  if (err) return <div className="alert alert-danger">{err}</div>;

  return (
    <div>
      <div className="mb-3">
        <h5 className="fw-light mb-1">Watch</h5>
        <div style={{ opacity: 0.7 }}>Member view (trailers + episodes)</div>
      </div>

      <div className="row g-3">
        {videos.map((v) => (
          <div key={v.id} className="col-12 col-md-6 col-lg-4">
            <VideoCard video={v} onPlay={setActive} />
          </div>
        ))}
      </div>

      {active && <VideoPlayer video={active} onClose={() => setActive(null)} />}
    </div>
  );
}
