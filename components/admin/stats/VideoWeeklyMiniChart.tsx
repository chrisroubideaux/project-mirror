// components/admin/stats/VideoWeeklyMiniChart.tsx

'use client';

import {
  BarChart,
  Bar,
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
  week: string;
  views: number;
};

export default function VideoWeeklyMiniChart({
  videoId,
}: {
  videoId: string;
}) {
  const [data, setData] = useState<Point[]>([]);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    fetch(
      `${API_BASE}/api/videos/admin/video/${videoId}/views/weekly`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [videoId]);

  return (
    <div style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="week" hide />
          <YAxis hide />
          <Tooltip />
          <Bar dataKey="views" fill="#00e0ff" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
