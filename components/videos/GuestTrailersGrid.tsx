// components/videos/GuestTrailersGrid.tsx
'use client';

import { useEffect, useState } from 'react';
import VideoCard, { type PublicVideo } from './VideoCard';
import VideoPlayer from './VideoPlayer';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function GuestTrailersGrid() {
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<PublicVideo | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/videos`);
        const data = (await res.json()) as PublicVideo[];
        setVideos(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-3">Loading trailers…</div>;

  return (
    <div>
      <div className="mb-3">
        <h5 className="fw-light mb-1">Trailers</h5>
        <div style={{ opacity: 0.7 }}>Guest view (public trailers only)</div>
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
