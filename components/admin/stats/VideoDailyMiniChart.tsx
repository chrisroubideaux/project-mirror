// components/admin/stats/VideoDailyMiniChart.tsx
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

type Props = {
  videoId: string;
  days?: number;
};

export default function VideoDailyMiniChart({
  videoId,
  days = 30,
}: Props) {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoId) return;

    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    setLoading(true);

    fetch(
      `${API_BASE}/api/videos/admin/video/${videoId}/views/daily?days=${days}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(res => res.json())
      .then(res => {
        setData(res);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [videoId, days]);

  if (loading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ height: 180, color: '#777' }}
      >
        Loading daily trend…
      </div>
    );
  }

  if (!data.length) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ height: 180, color: '#777' }}
      >
        No daily data yet.
      </div>
    );
  }

  return (
    <div style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#9aa0a6', fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: '#9aa0a6', fontSize: 11 }}
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
