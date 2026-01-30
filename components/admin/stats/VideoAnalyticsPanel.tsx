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
   Thresholds
============================= */

const GUEST_SURGE_RATIO = 0.65;   // % of total
const MEMBER_SURGE_RATIO = 0.55;

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
     Lock scroll + ESC
  --------------------------------------------- */
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

  /* ---------------------------------------------
     Fetch analytics
  --------------------------------------------- */
  useEffect(() => {
    if (!token || !videoId) return;

    let mounted = true;
    setLoading(true);

    fetch(`${API_BASE}/api/videos/admin/video/${videoId}/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: AnalyticsResponse) => {
        if (mounted) setData(json);
      })
      .catch(err => {
        console.error('VideoAnalyticsPanel fetch failed:', err);
        if (mounted) setData(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [videoId, token]);

  /* ---------------------------------------------
     Derived alerts + insight (cheap)
  --------------------------------------------- */
  const insight = useMemo(() => {
    if (!data || data.total_views === 0) return null;

    const guestRatio = data.guest_views / data.total_views;
    const memberRatio = data.member_views / data.total_views;

    const guestSurge = guestRatio >= GUEST_SURGE_RATIO;
    const memberSurge = memberRatio >= MEMBER_SURGE_RATIO;

    let text = 'Traffic is stable.';
    let level: 'info' | 'warning' | 'success' = 'info';

    if (guestSurge && !memberSurge) {
      text =
        'Guest traffic spiked — likely external exposure (share, trailer, embed).';
      level = 'warning';
    } else if (memberSurge && !guestSurge) {
      text =
        'Member engagement is strong — organic return viewers detected.';
      level = 'success';
    } else if (guestSurge && memberSurge) {
      text =
        'Both guest and member traffic surged — platform-wide momentum.';
      level = 'success';
    }

    return {
      guestSurge,
      memberSurge,
      text,
      level,
    };
  }, [data]);

  /* ---------------------------------------------
     Render
  --------------------------------------------- */
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{ zIndex: 9999, background: 'rgba(0,0,0,0.45)' }}
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
              {/* KPI + Poster */}
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
                    {([
                      ['Total Views', data.total_views],
                      ['Guest Views', data.guest_views],
                      ['Member Views', data.member_views],
                    ] as const).map(([label, value]) => (
                      <div key={label} className="col-sm-4">
                        <div
                          className="p-3 rounded position-relative"
                          style={{
                            border: '1px solid var(--aurora-modal-border)',
                          }}
                        >
                          <div style={{ fontSize: 12, color: '#9aa0a6' }}>
                            {label}
                          </div>

                          <div className="fw-semibold fs-4">
                            {value}
                          </div>

                          {label === 'Guest Views' &&
                            insight?.guestSurge && (
                              <span className="badge bg-danger position-absolute top-0 end-0 m-2">
                                Surge
                              </span>
                            )}

                          {label === 'Member Views' &&
                            insight?.memberSurge && (
                              <span className="badge bg-success position-absolute top-0 end-0 m-2">
                                Strong
                              </span>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Insight */}
                  {insight && (
                    <div
                      className={`mt-3 alert alert-${
                        insight.level === 'warning'
                          ? 'danger'
                          : insight.level === 'success'
                          ? 'success'
                          : 'secondary'
                      } py-2`}
                    >
                      {insight.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Mini sparkline */}
              <div
                className="mt-3 p-3 rounded"
                style={{
                  border: '1px solid var(--aurora-modal-border)',
                }}
              >
                <div style={{ fontSize: 13, color: '#9aa0a6' }}>
                  Daily Views (last 30 days)
                </div>
                <VideoDailyMiniChart videoId={videoId} />
              </div>

              {/* Stacked chart */}
              <div
                className="mt-4 p-3 rounded"
                style={{
                  border: '1px solid var(--aurora-modal-border)',
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
'use client';

import { useEffect, useMemo, useState } from 'react';
import VideoDailyMiniChart from './VideoDailyMiniChart';
import ViewsStackedAreaChart from './ViewsStackedAreaChart';

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

type Props = {
  videoId: string;
  onClose: () => void;
};




export default function VideoAnalyticsPanel({ videoId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  const token = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }, []);

 
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


    

*/}