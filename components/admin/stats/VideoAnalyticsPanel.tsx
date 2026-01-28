// components/admin/stats/VideoAnalyticsPanel.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN_KEY = 'aurora_admin_token';

type Video = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  poster_url: string;
  video_url: string;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
};

type AnalyticsResponse = {
  video: Video;
  total_views: number;
  guest_views: number;
  member_views: number;
};

type Props = {
  videoId: string;
  onClose: () => void;
};

export default function VideoAnalyticsPanel({ videoId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  const token = useMemo(
    () => (typeof window !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_KEY) : null),
    []
  );

  // ---------------------------------------------
  // Close on ESC + lock scroll
  // ---------------------------------------------
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  // ---------------------------------------------
  // Fetch analytics
  // ---------------------------------------------
  useEffect(() => {
    if (!token) return;

    setLoading(true);

    fetch(`${API_BASE}/api/videos/admin/video/${videoId}/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(res => {
        setData(res);
      })
      .catch(err => {
        console.error(err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [videoId, token]);

  // ---------------------------------------------
  // Render
  // ---------------------------------------------
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{
        zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
      }}
      onMouseDown={(e) => {
        // click outside -> close
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="position-absolute top-50 start-50 translate-middle"
        style={{
          width: 'min(960px, 92vw)',
          maxHeight: '86vh',
          overflow: 'auto',
          borderRadius: 18,
          background: 'var(--aurora-bento-bg)',
          border: '1px solid var(--aurora-bento-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          className="d-flex align-items-center justify-content-between px-4 py-3"
          style={{
            borderBottom: '1px solid var(--aurora-bento-border)',
          }}
        >
          <div>
            <div className="fw-light" style={{ fontSize: 16 }}>
              Video Analytics
            </div>
            <div style={{ fontSize: 12, color: '#9aa0a6' }}>
              Drill-down · guests vs members · trends
            </div>
          </div>

          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
            aria-label="Close analytics modal"
          >
            Close ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {loading && (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ height: 220, color: '#777' }}
            >
              Loading video analytics…
            </div>
          )}

          {!loading && !data && (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ height: 220, color: '#777' }}
            >
              No analytics found.
            </div>
          )}

          {!loading && data && (
            <>
              {/* Top row: poster + quick stats */}
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <div
                    className="rounded"
                    style={{
                      overflow: 'hidden',
                      border: '1px solid var(--aurora-bento-border)',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <img
                      src={data.video.poster_url}
                      alt={data.video.title}
                      style={{
                        width: '100%',
                        height: 220,
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>

                  <div className="mt-3">
                    <div className="fw-light" style={{ fontSize: 16 }}>
                      {data.video.title}
                    </div>
                    {data.video.subtitle && (
                      <div style={{ fontSize: 12, color: '#9aa0a6' }}>
                        {data.video.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-12 col-md-8">
                  <div className="row g-3">
                    <div className="col-12 col-sm-4">
                      <div
                        className="p-3 rounded"
                        style={{
                          border: '1px solid var(--aurora-bento-border)',
                          background: 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <div style={{ fontSize: 12, color: '#9aa0a6' }}>
                          Total Views
                        </div>
                        <div style={{ fontSize: 22 }} className="fw-semibold">
                          {data.total_views}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-4">
                      <div
                        className="p-3 rounded"
                        style={{
                          border: '1px solid var(--aurora-bento-border)',
                          background: 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <div style={{ fontSize: 12, color: '#9aa0a6' }}>
                          Guest Views
                        </div>
                        <div style={{ fontSize: 22 }} className="fw-semibold">
                          {data.guest_views}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-4">
                      <div
                        className="p-3 rounded"
                        style={{
                          border: '1px solid var(--aurora-bento-border)',
                          background: 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <div style={{ fontSize: 12, color: '#9aa0a6' }}>
                          Member Views
                        </div>
                        <div style={{ fontSize: 22 }} className="fw-semibold">
                          {data.member_views}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Placeholder for Step 3/4 */}
                  <div
                    className="mt-3 p-3 rounded"
                    style={{
                      border: '1px dashed var(--aurora-bento-border)',
                      background: 'rgba(255,255,255,0.01)',
                      color: '#8b8f97',
                    }}
                  >
                    Next: mini daily chart + stacked bars inside this modal.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 d-flex justify-content-end"
          style={{
            borderTop: '1px solid var(--aurora-bento-border)',
          }}
        >
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}



{/*
// components/admin/stats/VideoAnalyticsPanel.tsx
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useEffect, useState } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const ADMIN_TOKEN_KEY = 'aurora_admin_token';

type Analytics = {
  video: {
    id: string;
    title: string;
  };
  total_views: number;
  guest_views: number;
  member_views: number;
};

type DailyPoint = {
  date: string;
  views: number;
};

type Props = {
  videoId: string;
  onClose: () => void;
};

export default function VideoAnalyticsPanel({ videoId, onClose }: Props) {
  const [summary, setSummary] = useState<Analytics | null>(null);
  const [daily, setDaily] = useState<DailyPoint[]>([]);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    // summary
    fetch(`${API_BASE}/api/videos/admin/video/${videoId}/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setSummary)
      .catch(console.error);

    // daily mini chart
    fetch(
      `${API_BASE}/api/videos/admin/video/${videoId}/views/daily?days=30`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then(res => res.json())
      .then(setDaily)
      .catch(console.error);
  }, [videoId]);

  if (!summary) return null;

  return (
    <div
      className="mt-4 p-4 rounded"
      style={{
        background: 'var(--aurora-bento-bg)',
        border: '1px solid var(--aurora-bento-border)',
      }}
    >
     
      <div className="d-flex justify-content-between mb-3">
        <h6 className="fw-light mb-0">
          {summary.video.title} — Analytics
        </h6>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="row text-center mb-4">
        <div className="col">
          <div className="text-muted small">Total</div>
          <div className="fs-5">{summary.total_views}</div>
        </div>
        <div className="col">
          <div className="text-muted small">Guests</div>
          <div className="fs-5">{summary.guest_views}</div>
        </div>
        <div className="col">
          <div className="text-muted small">Members</div>
          <div className="fs-5">{summary.member_views}</div>
        </div>
      </div>

      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={daily}>
            <XAxis
              dataKey="date"
              tick={{ fill: '#aaa', fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: '#aaa', fontSize: 11 }}
              allowDecimals={false}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="views"
              stroke="#00e0ff"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

    

*/}