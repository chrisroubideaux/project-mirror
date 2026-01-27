// components/admin/stats/ViewsLineChart.tsx
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

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    fetch(`${API_BASE}/api/videos/admin/views/daily`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fill: '#aaa' }} />
          <YAxis tick={{ fill: '#aaa' }} />
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
