// components/admin/stats/VideoAnalyticsPanel.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import VideoDailyMiniChart from './VideoDailyMiniChart';
import ViewsStackedAreaChart from './ViewsStackedAreaChart';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN_KEY = 'aurora_admin_token';

/* =============================
   Types
============================= */

type Video = {
  id: string;
  title: string;
  subtitle?: string | null;
  poster_url: string;
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

/* =============================
   Component
============================= */

export default function VideoAnalyticsPanel({ videoId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  const token = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }, []);

  /* ---------------------------------------------
     Lock scroll + ESC close
  --------------------------------------------- */
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  /* ---------------------------------------------
     Fetch analytics summary
  --------------------------------------------- */
  useEffect(() => {
    if (!token || !videoId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`${API_BASE}/api/videos/admin/video/${videoId}/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((json: AnalyticsResponse) => {
        if (isMounted) setData(json);
      })
      .catch(err => {
        console.error('VideoAnalyticsPanel fetch failed:', err);
        if (isMounted) setData(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [videoId, token]);

  /* ---------------------------------------------
     Render
  --------------------------------------------- */
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{
        zIndex: 9999,
        background: 'rgba(0,0,0,0.45)',
      }}
      onMouseDown={e => {
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
          background: 'var(--aurora-modal-bg)',
          border: '1px solid var(--aurora-modal-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 d-flex justify-content-between align-items-center"
          style={{ borderBottom: '1px solid var(--aurora-modal-border)' }}
        >
          <div>
            <div className="fw-light">Video Analytics</div>
            <div style={{ fontSize: 12, color: '#9aa0a6' }}>
              Trends · guests vs members
            </div>
          </div>

          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            Close ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {loading && (
            <div className="text-center text-muted py-5">
              Loading analytics…
            </div>
          )}

          {!loading && data && (
            <>
              {/* Poster + KPI cards */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <img
                    src={data.video.poster_url}
                    alt={data.video.title}
                    style={{
                      width: '100%',
                      height: 220,
                      objectFit: 'cover',
                      borderRadius: 12,
                      border: '1px solid var(--aurora-modal-border)',
                    }}
                  />
                </div>

                <div className="col-md-8">
                  <div className="row g-3">
                    {(
                      [
                        ['Total Views', data.total_views],
                        ['Guest Views', data.guest_views],
                        ['Member Views', data.member_views],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="col-sm-4">
                        <div
                          className="p-3 rounded"
                          style={{
                            border: '1px solid var(--aurora-modal-border)',
                            background: 'transparent',
                          }}
                        >
                          <div style={{ fontSize: 12, color: '#9aa0a6' }}>
                            {label}
                          </div>
                          <div className="fw-semibold fs-4">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mini daily sparkline */}
              <div
                className="mt-3 p-3 rounded"
                style={{
                  border: '1px solid var(--aurora-modal-border)',
                  background: 'transparent',
                }}
              >
                <div
                  className="mb-2"
                  style={{ fontSize: 13, color: '#9aa0a6' }}
                >
                  Daily Views (last 30 days)
                </div>

                <VideoDailyMiniChart videoId={videoId} />
              </div>

              {/* Stacked guest vs member time series */}
              <div
                className="mt-4 p-3 rounded"
                style={{
                  border: '1px solid var(--aurora-modal-border)',
                  background: 'transparent',
                }}
              >
                <ViewsStackedAreaChart videoId={videoId} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


{/*
// components/admin/stats/VideoAnalyticsPanel.tsx
// components/admin/stats/VideoAnalyticsPanel.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN_KEY = 'aurora_admin_token';

type Video = {
  id: string;
  title: string;
  subtitle?: string | null;
  poster_url: string;
};

type AnalyticsResponse = {
  video: Video;
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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [daily, setDaily] = useState<DailyPoint[]>([]);

  const token = useMemo(
    () =>
      typeof window !== 'undefined'
        ? localStorage.getItem(ADMIN_TOKEN_KEY)
        : null,
    []
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  
  useEffect(() => {
    if (!token) return;

    setLoading(true);

    Promise.all([
      fetch(`${API_BASE}/api/videos/admin/video/${videoId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => res.json()),

      fetch(
        `${API_BASE}/api/videos/admin/video/${videoId}/views/daily`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ).then(res => res.json()),
    ])
      .then(([analytics, dailyViews]) => {
        setData(analytics);
        setDaily(dailyViews);
      })
      .catch(err => {
        console.error(err);
        setData(null);
        setDaily([]);
      })
      .finally(() => setLoading(false));
  }, [videoId, token]);

  
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{
        zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
      }}
      onMouseDown={e => {
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
        <div className="px-4 py-3 d-flex justify-content-between align-items-center"
          style={{ borderBottom: '1px solid var(--aurora-bento-border)' }}
        >
          <div>
            <div className="fw-light">Video Analytics</div>
            <div style={{ fontSize: 12, color: '#9aa0a6' }}>
              Trends · guests vs members
            </div>
          </div>

          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            Close ✕
          </button>
        </div>

        <div className="p-4">
          {loading && (
            <div className="text-center text-muted py-5">
              Loading analytics…
            </div>
          )}

          {!loading && data && (
            <>

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <img
                    src={data.video.poster_url}
                    alt={data.video.title}
                    style={{
                      width: '100%',
                      height: 220,
                      objectFit: 'cover',
                      borderRadius: 12,
                      border: '1px solid var(--aurora-bento-border)',
                    }}
                  />
                </div>

                <div className="col-md-8">
                  <div className="row g-3">
                    {[
                      ['Total Views', data.total_views],
                      ['Guest Views', data.guest_views],
                      ['Member Views', data.member_views],
                    ].map(([label, value]) => (
                      <div key={label} className="col-sm-4">
                        <div
                          className="p-3 rounded"
                          style={{
                            border: '1px solid var(--aurora-bento-border)',
                            background: 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <div style={{ fontSize: 12, color: '#303031' }}>
                            {label}
                          </div>
                          <div className="fw-semibold fs-4">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-2" style={{ fontSize: 13, color: '#757576' }}>
                  Daily Views (Last {daily.length} days)
                </div>

                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={daily}>
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
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

             
              <div>
                <div className="mb-2" style={{ fontSize: 13, color: '#585959' }}>
                  Guest vs Member Views
                </div>

                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: 'Views',
                          guest: data.guest_views,
                          member: data.member_views,
                        },
                      ]}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="guest" stackId="a" fill="#6876f7" />
                      <Bar dataKey="member" stackId="a" fill="#ff9d00" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

    

*/}