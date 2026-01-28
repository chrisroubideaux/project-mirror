// components/admin/stats/ViewsBarChart.tsx
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useEffect, useState } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const ADMIN_TOKEN_KEY = 'aurora_admin_token';

/* =============================
   Types
============================= */

type Video = {
  id: string;
  title: string;
  view_count: number;
};

type ViewsBarChartProps = {
  onSelectVideo?: (videoId: string) => void;
};

/* =============================
   Component
============================= */

export default function ViewsBarChart({
  onSelectVideo,
}: ViewsBarChartProps) {
  const [data, setData] = useState<Video[]>([]);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    fetch(`${API_BASE}/api/videos/admin/top`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div
      className="p-4 rounded"
      style={{
        height: 320,
        background: 'var(--aurora-bento-bg)',
        border: '1px solid var(--aurora-bento-border)',
      }}
    >
      <h6 className="fw-light mb-3">Views per Video</h6>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          {/* Gradient definition */}
          <defs>
            <linearGradient id="barAurora" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00e0ff" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#00e0ff" stopOpacity={0.45} />
            </linearGradient>
          </defs>

          {/* Subtle grid */}
          <CartesianGrid
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />

          <XAxis
            dataKey="title"
            tick={{ fill: '#9aa0a6', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: '#9aa0a6', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />

          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={{
              background: '#0f1115',
              border: '1px solid #2a2c33',
              borderRadius: 8,
              fontSize: 12,
              color: '#fff',
            }}
            formatter={(v?: number) => [`${v ?? 0} views`, 'Views']}
          />

          <Bar
            dataKey="view_count"
            fill="url(#barAurora)"
            radius={[8, 8, 0, 0]}
            onClick={(entry) => {
              const videoId = entry?.payload?.id;
              if (videoId && onSelectVideo) {
                onSelectVideo(videoId);
              }
            }}
            style={{
              cursor: onSelectVideo ? 'pointer' : 'default',
              filter: 'drop-shadow(0 0 6px rgba(0,224,255,0.25))',
            }}
            isAnimationActive
            animationDuration={700}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


{/*

// components/admin/stats/ViewsBarChart.tsx
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



type Video = {
  id: string;
  title: string;
  view_count: number;
};

type ViewsBarChartProps = {
  onSelectVideo?: (videoId: string) => void;
};


export default function ViewsBarChart({
  onSelectVideo,
}: ViewsBarChartProps) {
  const [data, setData] = useState<Video[]>([]);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    fetch(`${API_BASE}/api/videos/admin/top`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div
      className="p-4 rounded"
      style={{
        height: 320,
        background: 'var(--aurora-bento-bg)',
        border: '1px solid var(--aurora-bento-border)',
      }}
    >
      <h6 className="fw-light mb-3">Views per Video</h6>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="title"
            tick={{ fill: '#aaa', fontSize: 12 }}
          />
          <YAxis
            tick={{ fill: '#aaa', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{
              background: '#111',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
            }}
          />
          <Bar
            dataKey="view_count"
            fill="#00e0ff"
            radius={[6, 6, 0, 0]}
            onClick={(entry) => {
              const videoId = entry?.payload?.id;
              if (videoId && onSelectVideo) {
                onSelectVideo(videoId);
              }
            }}
            style={{ cursor: onSelectVideo ? 'pointer' : 'default' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


*/}