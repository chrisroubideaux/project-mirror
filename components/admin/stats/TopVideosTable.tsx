// components/admin/stats/TopVideosTable.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const ADMIN_TOKEN_KEY = 'aurora_admin_token';

/* --------------------------------------------------
   Types
-------------------------------------------------- */

type TopVideo = {
  id: string;
  title: string;
  poster_url: string;
  type: string;
  visibility: string;
  view_count: number;
  created_at: string;
};

/* --------------------------------------------------
   Component
-------------------------------------------------- */

export default function TopVideosTable() {
  const [videos, setVideos] = useState<TopVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError('Missing admin token');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/videos/admin/top`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to fetch top videos');
        }

        const data = (await res.json()) as TopVideo[];
        setVideos(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load top videos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* --------------------------------------------------
     States
  -------------------------------------------------- */

  if (loading) {
    return (
      <div
        className="p-4"
        style={{
          borderRadius: 16,
          background: 'var(--aurora-bento-bg)',
          border: '1px solid var(--aurora-bento-border)',
        }}
      >
        <h6 className="fw-light mb-3">Top Videos</h6>
        <div style={{ opacity: 0.5 }}>Loading analytics…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 text-danger"
        style={{
          borderRadius: 16,
          background: 'var(--aurora-bento-bg)',
          border: '1px solid var(--aurora-bento-border)',
        }}
      >
        {error}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div
        className="p-4"
        style={{
          borderRadius: 16,
          background: 'var(--aurora-bento-bg)',
          border: '1px solid var(--aurora-bento-border)',
          opacity: 0.6,
        }}
      >
        No video data yet
      </div>
    );
  }

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="p-4"
      style={{
        borderRadius: 16,
        background: 'var(--aurora-bento-bg)',
        border: '1px solid var(--aurora-bento-border)',
      }}
    >
      <h6 className="fw-light mb-3">Top Performing Videos</h6>

      <div className="table-responsive">
        <table className="table table-borderless align-middle mb-0">
          <thead style={{ opacity: 0.6 }}>
            <tr>
              <th>#</th>
              <th>Video</th>
              <th>Type</th>
              <th>Visibility</th>
              <th className="text-end">Views</th>
              <th>Uploaded</th>
            </tr>
          </thead>

          <tbody>
            {videos.map((video, index) => {
              const uploadDate = new Date(video.created_at);
              const daysAgo = Math.max(
                1,
                Math.floor(
                  (Date.now() - uploadDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              );

              return (
                <tr
                  key={video.id}
                  style={{
                    cursor: 'default',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      'rgba(255,255,255,0.03)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      'transparent')
                  }
                >
                  <td>{index + 1}</td>

                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <Image
                        src={video.poster_url}
                        alt={video.title}
                        width={72}
                        height={40}
                        style={{
                          borderRadius: 8,
                          objectFit: 'cover',
                        }}
                      />
                      <div
                        style={{
                          maxWidth: 260,
                          fontSize: 14,
                          fontWeight: 500,
                          lineHeight: 1.3,
                        }}
                      >
                        {video.title}
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="badge bg-secondary">
                      {video.type}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        video.visibility === 'public'
                          ? 'bg-success'
                          : 'bg-warning'
                      }`}
                    >
                      {video.visibility}
                    </span>
                  </td>

                  <td className="text-end fw-semibold">
                    {video.view_count.toLocaleString()}
                  </td>

                  <td style={{ opacity: 0.6 }}>
                    {daysAgo}d ago
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
