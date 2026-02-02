// components/admin/stats/ViewsStackedAreaChart.tsx
'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  Scatter,
} from 'recharts';
import { useEffect, useMemo, useState } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN_KEY = 'aurora_admin_token';

/* =============================
   Types
============================= */

type Point = {
  date: string;
  guest: number;
  member: number;
  guestAvg?: number;
  guestSpike?: boolean;
};

type AnalyticsAlert = {
  id: string;
  severity: 'info' | 'warning' | 'danger';
  created_at: string;
};

type RangeKey = '7' | '30' | 'all';
type Granularity = 'daily' | 'weekly';

type Props = {
  videoId: string;
};

/* =============================
   Config
============================= */

const ROLLING_WINDOW = 7;
const GUEST_SPIKE_RATIO = 1.8;

const severityColor: Record<AnalyticsAlert['severity'], string> = {
  info: 'var(--accent)',
  warning: '#ffb020',
  danger: '#ff4d4f',
};

/* =============================
   Component
============================= */

export default function ViewsStackedAreaChart({ videoId }: Props) {
  const [data, setData] = useState<Point[]>([]);
  const [alerts, setAlerts] = useState<AnalyticsAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const [range, setRange] = useState<RangeKey>('30');
  const [mode, setMode] = useState<Granularity>('daily');
  const [showAverages, setShowAverages] = useState(true);

  const token = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }, []);

  /* ---------------------------------------------
     Fetch stacked view data
  --------------------------------------------- */
  useEffect(() => {
    if (!token || !videoId) return;

    setLoading(true);

    const daysParam = range === 'all' ? '' : `?days=${range}`;
    const endpoint =
      mode === 'weekly'
        ? `/api/videos/admin/video/${videoId}/views/weekly/stacked`
        : `/api/videos/admin/video/${videoId}/views/daily/stacked`;

    fetch(`${API_BASE}${endpoint}${daysParam}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(raw => {
        if (!Array.isArray(raw)) return [];

        return raw.map((p, i, arr) => {
          const slice = arr.slice(
            Math.max(0, i - ROLLING_WINDOW + 1),
            i + 1
          );

          const guestAvg =
            slice.reduce((s, x) => s + x.guest, 0) / slice.length;

          return {
            ...p,
            guestAvg: Math.round(guestAvg),
            guestSpike:
              guestAvg > 0 && p.guest > guestAvg * GUEST_SPIKE_RATIO,
          };
        });
      })
      .then(setData)
      .finally(() => setLoading(false));
  }, [videoId, range, mode, token]);

  /* ---------------------------------------------
     Fetch alerts (for anomaly markers)
  --------------------------------------------- */
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/videos/admin/alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setAlerts)
      .catch(console.error);
  }, [token]);

  /* ---------------------------------------------
     Index alerts by date (YYYY-MM-DD)
  --------------------------------------------- */
  const alertsByDate = useMemo(() => {
    const map: Record<string, AnalyticsAlert[]> = {};
    alerts.forEach(a => {
      const d = a.created_at.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(a);
    });
    return map;
  }, [alerts]);

  if (loading) {
    return (
      <div
        className="small text-muted d-flex align-items-center justify-content-center"
        style={{ height: 220 }}
      >
        Loading stacked views…
      </div>
    );
  }

  /* ---------------------------------------------
     Render
  --------------------------------------------- */
  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between mb-2">
        <div className="small text-muted">
          Guest vs Member ({mode})
        </div>

        <div className="d-flex gap-2 flex-wrap">
          {(['7', '30', 'all'] as RangeKey[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="btn btn-sm"
              style={{
                border: '1px solid var(--aurora-modal-border)',
                color:
                  range === r
                    ? 'var(--accent)'
                    : 'var(--foreground-muted)',
                background: 'transparent',
              }}
            >
              {r === 'all' ? 'All' : `${r}d`}
            </button>
          ))}

          <button
            className="btn btn-sm"
            onClick={() =>
              setMode(mode === 'daily' ? 'weekly' : 'daily')
            }
          >
            {mode === 'daily' ? 'Weekly' : 'Daily'}
          </button>

          <button
            className="btn btn-sm"
            onClick={() => setShowAverages(v => !v)}
          >
            Avg
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis hide />
            <Tooltip />

            <Area
              dataKey="guest"
              stackId="1"
              stroke="#6876f7"
              fillOpacity={0.35}
            />
            <Area
              dataKey="member"
              stackId="1"
              stroke="var(--accent)"
              fillOpacity={0.35}
            />

            {showAverages && (
              <Line
                dataKey="guestAvg"
                stroke="#a5a9ff"
                strokeDasharray="5 5"
                dot={false}
              />
            )}

            {/* 🔴 Anomaly → Alert navigation */}
            <Scatter
              data={data.filter(d => alertsByDate[d.date])}
              shape={({ cx, cy, payload }) => {
                const alert = alertsByDate[payload.date]?.[0];
                if (!alert) return null;

                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={severityColor[alert.severity]}
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('jump-to-alert', {
                          detail: { alertId: alert.id },
                        })
                      )
                    }
                  />
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


{/*
'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Line,
} from 'recharts';
import { useEffect, useMemo, useState } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN_KEY = 'aurora_admin_token';



type Point = {
  date: string;
  guest: number;
  member: number;
  guestAvg?: number;
  memberAvg?: number;
  guestSpike?: boolean;
  memberSpike?: boolean;
};

type RangeKey = '7' | '30' | 'all';
type Granularity = 'daily' | 'weekly';

type Props = {
  videoId: string;
};



const ROLLING_WINDOW = 7;
const GUEST_SPIKE_RATIO = 1.8;
const MEMBER_SPIKE_RATIO = 1.5;


export default function ViewsStackedAreaChart({ videoId }: Props) {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  const [range, setRange] = useState<RangeKey>('30');
  const [mode, setMode] = useState<Granularity>('daily');

  const [showAverages, setShowAverages] = useState(true);
  const [highlightAnomalies, setHighlightAnomalies] = useState(false);

  const token = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }, []);

  
  useEffect(() => {
    if (!token || !videoId) return;

    setLoading(true);

    const daysParam = range === 'all' ? '' : `?days=${range}`;
    const endpoint =
      mode === 'weekly'
        ? `/api/videos/admin/video/${videoId}/views/weekly/stacked`
        : `/api/videos/admin/video/${videoId}/views/daily/stacked`;

    fetch(`${API_BASE}${endpoint}${daysParam}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(raw => {
        if (!Array.isArray(raw)) return [];

        return raw.map((p, i, arr) => {
          const slice = arr.slice(
            Math.max(0, i - ROLLING_WINDOW + 1),
            i + 1
          );

          const guestAvg =
            slice.reduce((s, x) => s + x.guest, 0) / slice.length;

          const memberAvg =
            slice.reduce((s, x) => s + x.member, 0) / slice.length;

          return {
            ...p,
            guestAvg: Math.round(guestAvg),
            memberAvg: Math.round(memberAvg),
            guestSpike:
              guestAvg > 0 && p.guest > guestAvg * GUEST_SPIKE_RATIO,
            memberSpike:
              memberAvg > 0 && p.member > memberAvg * MEMBER_SPIKE_RATIO,
          };
        });
      })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [videoId, range, mode, token]);

  
  const hasGuestAlert = data.some(p => p.guestSpike);
  const hasMemberAlert = data.some(p => p.memberSpike);

  
  if (loading) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
        Loading stacked views…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
        No view data yet
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 13, color: '#9aa0a6' }}>
          Guest vs Member ({mode})
          {hasGuestAlert && (
            <span style={{ marginLeft: 8, color: '#ff6b6b' }}>
              ● Guest Spike
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['7', '30', 'all'] as RangeKey[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 6,
                border: '1px solid var(--aurora-modal-border)',
                background:
                  range === r ? 'rgba(0,224,255,0.15)' : 'transparent',
                color: range === r ? '#00e0ff' : '#9aa0a6',
              }}
            >
              {r === 'all' ? 'All' : `${r}d`}
            </button>
          ))}

          <button
            onClick={() =>
              setMode(mode === 'daily' ? 'weekly' : 'daily')
            }
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid var(--aurora-modal-border)',
              color: '#9aa0a6',
            }}
          >
            {mode === 'daily' ? 'Weekly' : 'Daily'}
          </button>

          <button
            onClick={() => setShowAverages(v => !v)}
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid var(--aurora-modal-border)',
              color: showAverages ? '#00e0ff' : '#9aa0a6',
            }}
          >
            Avg
          </button>

          <button
            onClick={() => setHighlightAnomalies(v => !v)}
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid var(--aurora-modal-border)',
              color: highlightAnomalies ? '#ff6b6b' : '#9aa0a6',
            }}
          >
            Anomalies
          </button>
        </div>
      </div>

      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#9aa0a6', fontSize: 11 }} />
            <YAxis hide />

            <Tooltip />

            {!highlightAnomalies && (
              <>
                <Area dataKey="guest" stackId="1" stroke="#6876f7" fillOpacity={0.35} />
                <Area dataKey="member" stackId="1" stroke="#00e0ff" fillOpacity={0.35} />
              </>
            )}

            {showAverages && (
              <>
                <Line dataKey="guestAvg" stroke="#a5a9ff" strokeDasharray="5 5" dot={false} />
                <Line dataKey="memberAvg" stroke="#7ff5ff" strokeDasharray="5 5" dot={false} />
              </>
            )}

            <Line
              dataKey="guest"
              dot={({ cx, cy, payload }) =>
                payload.guestSpike ? (
                  <circle cx={cx} cy={cy} r={5} fill="#ff6b6b" />
                ) : null
              }
              stroke="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


*/}
