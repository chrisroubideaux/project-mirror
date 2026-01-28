// components/admin/stats/PlatformViewsLineChart.tsx
'use client';

import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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
  views: number;
};

type Granularity = 'daily' | 'weekly';

/* =============================
   Component
============================= */

export default function PlatformViewsLineChart() {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Granularity>('daily');

  const token = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }, []);

  /* ---------------------------------------------
     Fetch platform analytics
  --------------------------------------------- */
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const endpoint =
      mode === 'weekly'
        ? '/api/videos/admin/views/weekly/events'
        : '/api/videos/admin/views/daily';

    fetch(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(res => {
        if (!isMounted || !Array.isArray(res)) return;

        setData(
          res.map((r: any) => ({
            date: r.date ?? r.week,
            views: r.views ?? 0,
          }))
        );
      })
      .catch(err => {
        console.error('PlatformViewsLineChart error:', err);
        if (isMounted) setData([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, mode]);

  /* ---------------------------------------------
     Render states
  --------------------------------------------- */

  if (loading) {
    return (
      <div
        style={{
          height: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#777',
        }}
      >
        Loading platform views…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        style={{
          height: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#777',
        }}
      >
        No data yet
      </div>
    );
  }

  /* ---------------------------------------------
     Chart
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
          Platform Views ({mode})
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setMode('daily')}
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid var(--aurora-bento-border)',
              background:
                mode === 'daily'
                  ? 'rgba(0,224,255,0.15)'
                  : 'transparent',
              color: mode === 'daily' ? '#00e0ff' : '#9aa0a6',
            }}
          >
            Daily
          </button>

          <button
            onClick={() => setMode('weekly')}
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid var(--aurora-bento-border)',
              background:
                mode === 'weekly'
                  ? 'rgba(0,224,255,0.15)'
                  : 'transparent',
              color: mode === 'weekly' ? '#00e0ff' : '#9aa0a6',
            }}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <defs>
              <linearGradient id="platformFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e0ff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00e0ff" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Subtle grid = visual grounding */}
            <CartesianGrid
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={40}
            />

            <Tooltip
              formatter={(v?: number) => [`${v ?? 0} views`, 'Views']}
              contentStyle={{
                background: '#0f1115',
                border: '1px solid #2a2c33',
                borderRadius: 8,
                fontSize: 12,
              }}
            />

            <Area
              dataKey="views"
              fill="url(#platformFill)"
              stroke="none"
              isAnimationActive
              animationDuration={700}
            />

            <Line
              dataKey="views"
              stroke="#00e0ff"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive
              animationDuration={700}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

{/*
'use client';

import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useEffect, useMemo, useState } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN_KEY = 'aurora_admin_token';


type Point = {
  date: string;
  views: number;
};

type Granularity = 'daily' | 'weekly';



export default function PlatformViewsLineChart() {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Granularity>('daily');

  const token = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }, []);

  
  useEffect(() => {
    // 🔥 IMPORTANT: always exit loading if token is missing
    if (!token) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const endpoint =
      mode === 'weekly'
        ? '/api/videos/admin/views/weekly/events'
        : '/api/videos/admin/views/daily';

    fetch(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(res => {
        if (!isMounted || !Array.isArray(res)) return;

        // ✅ normalize daily + weekly shape
        setData(
          res.map((r: any) => ({
            date: r.date ?? r.week,
            views: r.views ?? 0,
          }))
        );
      })
      .catch(err => {
        console.error('PlatformViewsLineChart error:', err);
        if (isMounted) setData([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, mode]);


  if (loading) {
    return (
      <div
        style={{
          height: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#777',
        }}
      >
        Loading platform views…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        style={{
          height: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#777',
        }}
      >
        No data yet
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
          Platform Views ({mode})
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setMode('daily')}
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid var(--aurora-bento-border)',
              background:
                mode === 'daily'
                  ? 'rgba(0,224,255,0.15)'
                  : 'transparent',
              color: mode === 'daily' ? '#00e0ff' : '#9aa0a6',
            }}
          >
            Daily
          </button>

          <button
            onClick={() => setMode('weekly')}
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid var(--aurora-bento-border)',
              background:
                mode === 'weekly'
                  ? 'rgba(0,224,255,0.15)'
                  : 'transparent',
              color: mode === 'weekly' ? '#00e0ff' : '#9aa0a6',
            }}
          >
            Weekly
          </button>
        </div>
      </div>

      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <defs>
              <linearGradient id="platformFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e0ff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00e0ff" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis dataKey="date" hide />
            <YAxis hide />

            <Tooltip
              formatter={(v?: number) => [`${v ?? 0} views`, 'Views']}
              contentStyle={{
                background: '#0f1115',
                border: '1px solid #2a2c33',
                borderRadius: 8,
                fontSize: 12,
              }}
            />

            <Area
              dataKey="views"
              fill="url(#platformFill)"
              stroke="none"
              isAnimationActive
              animationDuration={700}
            />
            <Line
              dataKey="views"
              stroke="#00e0ff"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive
              animationDuration={700}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

*/}
