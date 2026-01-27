// components/admin/stats/StatCards.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  FaVideo,
  FaEye,
  FaChartLine,
  FaCheckCircle,
} from 'react-icons/fa';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const ADMIN_TOKEN_KEY = 'aurora_admin_token';

type VideoStats = {
  total_videos: number;
  active_videos: number;
  total_views: number;
  average_views_per_video: number;
};

export default function StatCards() {
  const [stats, setStats] = useState<VideoStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    fetch(`${API_BASE}/api/videos/admin/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="row g-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="col-md-3">
            <div
              className="p-4 rounded"
              style={{
                background: 'var(--aurora-bento-bg)',
                border: '1px solid var(--aurora-bento-border)',
                height: 110,
                opacity: 0.5,
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: 'Total Videos',
      value: stats.total_videos,
      icon: <FaVideo />,
    },
    {
      label: 'Active Videos',
      value: stats.active_videos,
      icon: <FaCheckCircle />,
    },
    {
      label: 'Total Views',
      value: stats.total_views.toLocaleString(),
      icon: <FaEye />,
    },
    {
      label: 'Avg Views / Video',
      value: stats.average_views_per_video.toFixed(1),
      icon: <FaChartLine />,
    },
  ];

  return (
    <div className="row g-4">
      {cards.map(({ label, value, icon }) => (
        <div key={label} className="col-md-3">
          <div
            className="p-4 h-100 rounded shadow-sm"
            style={{
              background: 'var(--aurora-bento-bg)',
              border: '1px solid var(--aurora-bento-border)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div
                  className="text-uppercase small mb-1"
                  style={{ opacity: 0.6 }}
                >
                  {label}
                </div>
                <div className="fs-3 fw-semibold">
                  {value}
                </div>
              </div>

              <div
                style={{
                  fontSize: 20,
                  opacity: 0.6,
                }}
              >
                {icon}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
