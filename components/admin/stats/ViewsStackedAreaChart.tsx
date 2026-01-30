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
  memberAvg?: number;
  guestSpike?: boolean;
  memberSpike?: boolean;
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
const MEMBER_SPIKE_RATIO = 1.5;

/* =============================
   Component
============================= */

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

  /* ---------------------------------------------
     Fetch + enrich data
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

  /* ---------------------------------------------
     Derived alert signal (for KPI badges)
  --------------------------------------------- */
  const hasGuestAlert = data.some(p => p.guestSpike);
  const hasMemberAlert = data.some(p => p.memberSpike);

  /* ---------------------------------------------
     Loading / Empty
  --------------------------------------------- */
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

  /* ---------------------------------------------
     Render
  --------------------------------------------- */
  return (
    <div>
      {/* Header */}
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
          {/* Range */}
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

          {/* Granularity */}
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

          {/* Toggles */}
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

      {/* Chart */}
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

            {/* Spike dots */}
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


{/*
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

type Props = {
  videoId: string;
};


const ROLLING_WINDOW = 7;
const GUEST_ALERT_RATIO = 1.8;

function exportCSV(filename: string, rows: Point[]) {
  const headers = [
    'date',
    'guest',
    'member',
    'guestAvg',
    'memberAvg',
  ].join(',');

  const body = rows
    .map(r =>
      [
        r.date,
        r.guest,
        r.member,
        r.guestAvg ?? '',
        r.memberAvg ?? '',
      ].join(',')
    )
    .join('\n');

  const blob = new Blob([headers + '\n' + body], {
    type: 'text/csv',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}



export default function ViewsStackedAreaChart({ videoId }: Props) {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>('30');

  const token = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }, []);

  
  useEffect(() => {
    if (!token || !videoId) return;

    setLoading(true);
    const daysParam = range === 'all' ? '' : `?days=${range}`;

    fetch(
      `${API_BASE}/api/videos/admin/video/${videoId}/views/daily/stacked${daysParam}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(res => res.json())
      .then(raw => {
        if (!Array.isArray(raw)) return [];

        return raw.map((p, i, arr) => {
          const slice = arr.slice(
            Math.max(0, i - ROLLING_WINDOW + 1),
            i + 1
          );

          const guestAvg =
            slice.reduce((s, x) => s + x.guest, 0) /
            slice.length;

          const memberAvg =
            slice.reduce((s, x) => s + x.member, 0) /
            slice.length;

          return {
            ...p,
            guestAvg: Math.round(guestAvg),
            memberAvg: Math.round(memberAvg),
            guestSpike:
              guestAvg > 0 && p.guest > guestAvg * GUEST_ALERT_RATIO,
            memberSpike:
              memberAvg > 0 && p.member > memberAvg * 1.5,
          };
        });
      })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [videoId, range, token]);


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
          Guest vs Member (Daily)
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
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
                  range === r
                    ? 'rgba(0,224,255,0.15)'
                    : 'transparent',
                color: range === r ? '#00e0ff' : '#9aa0a6',
              }}
            >
              {r === 'all' ? 'All' : `${r}d`}
            </button>
          ))}

          <button
            onClick={() =>
              exportCSV(
                `video-${videoId}-guest-member.csv`,
                data
              )
            }
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid var(--aurora-modal-border)',
              color: '#9aa0a6',
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="guestFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6876f7" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#6876f7" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="memberFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e0ff" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#00e0ff" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />

            <XAxis
              dataKey="date"
              tick={{ fill: '#9aa0a6', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis hide />

            <Tooltip
              formatter={(v?: number, name?: string) => [
                `${v ?? 0} views`,
                name,
              ]}
            />

         
            <Area dataKey="guest" stackId="1" stroke="#6876f7" fill="url(#guestFill)" />
            <Area dataKey="member" stackId="1" stroke="#00e0ff" fill="url(#memberFill)" />

          
            <Line dataKey="guestAvg" stroke="#a5a9ff" strokeDasharray="5 5" dot={false} />
            <Line dataKey="memberAvg" stroke="#7ff5ff" strokeDasharray="5 5" dot={false} />

          
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
