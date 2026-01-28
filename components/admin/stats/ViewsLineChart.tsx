// components/admin/stats/ViewsLineChart.tsx

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

type RangeKey = '7' | '30' | 'all';

type Props = {
  videoId: string;
};

export default function ViewsLineChart({ videoId }: Props) {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>('30');

  const token = useMemo(
    () =>
      typeof window !== 'undefined'
        ? localStorage.getItem(ADMIN_TOKEN_KEY)
        : null,
    []
  );

  useEffect(() => {
    if (!token || !videoId) return;

    setLoading(true);
    const daysParam = range === 'all' ? '' : `?days=${range}`;

    fetch(
      `${API_BASE}/api/videos/admin/video/${videoId}/views/daily${daysParam}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then(res => res.json())
      .then(res => setData(Array.isArray(res) ? res : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [videoId, range, token]);

  if (loading) {
    return <div style={{ height: 180, color: '#777' }}>Loading…</div>;
  }

  if (data.length === 0) {
    return <div style={{ height: 180, color: '#777' }}>No view data yet</div>;
  }

  return (
    <div style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <defs>
            <linearGradient id="videoFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00e0ff" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#00e0ff" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis dataKey="date" hide />
          <YAxis hide />

          <Tooltip
            formatter={(v?: number) => [`${v ?? 0} views`, 'Views']}
          />

          <Area dataKey="views" fill="url(#videoFill)" stroke="none" />
          <Line dataKey="views" stroke="#00e0ff" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


{/*

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

type Point = {
  date: string;
  views: number;
};

export default function ViewsLineChart() {
  const [data, setData] = useState<Point[]>([]);
  const [mounted, setMounted] = useState(false);

  // ✅ ensure DOM exists
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    fetch(`${API_BASE}/api/videos/admin/views/daily`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(res => {
        if (Array.isArray(res)) {
          setData(res);
        } else {
          console.warn('ViewsLineChart: unexpected response', res);
          setData([]);
        }
      })
      .catch(console.error);
  }, []);

  // ✅ prevent Recharts crash
  if (!mounted || data.length === 0) {
    return (
      <div
        style={{
          height: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#777',
        }}
      >
        Loading analytics…
      </div>
    );
  }

  return (
    <div style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
  );
}



*/}
