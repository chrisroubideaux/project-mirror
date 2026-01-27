// components/admin/stats/VideoAnalyticsPanel.tsx
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

type Analytics = {
  video: {
    id: string;
    title: string;
  };
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
  const [summary, setSummary] = useState<Analytics | null>(null);
  const [daily, setDaily] = useState<DailyPoint[]>([]);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    // summary
    fetch(`${API_BASE}/api/videos/admin/video/${videoId}/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setSummary)
      .catch(console.error);

    // daily mini chart
    fetch(
      `${API_BASE}/api/videos/admin/video/${videoId}/views/daily?days=30`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then(res => res.json())
      .then(setDaily)
      .catch(console.error);
  }, [videoId]);

  if (!summary) return null;

  return (
    <div
      className="mt-4 p-4 rounded"
      style={{
        background: 'var(--aurora-bento-bg)',
        border: '1px solid var(--aurora-bento-border)',
      }}
    >
      {/* =============================
          HEADER
      ============================= */}
      <div className="d-flex justify-content-between mb-3">
        <h6 className="fw-light mb-0">
          {summary.video.title} — Analytics
        </h6>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      {/* =============================
          COUNTS
      ============================= */}
      <div className="row text-center mb-4">
        <div className="col">
          <div className="text-muted small">Total</div>
          <div className="fs-5">{summary.total_views}</div>
        </div>
        <div className="col">
          <div className="text-muted small">Guests</div>
          <div className="fs-5">{summary.guest_views}</div>
        </div>
        <div className="col">
          <div className="text-muted small">Members</div>
          <div className="fs-5">{summary.member_views}</div>
        </div>
      </div>

      {/* =============================
          MINI DAILY CHART (STEP 1)
      ============================= */}
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={daily}>
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
    </div>
  );
}

{/*
'use client';

import { useEffect, useState } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN_KEY = 'aurora_admin_token';

type Analytics = {
  video: {
    id: string;
    title: string;
  };
  total_views: number;
  guest_views: number;
  member_views: number;
};

export default function VideoAnalyticsPanel({
  videoId,
  onClose,
}: {
  videoId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    fetch(`${API_BASE}/api/videos/admin/video/${videoId}/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [videoId]);

  if (!data) return null;

  return (
    <div className="p-4 mt-4 rounded border">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="fw-light mb-0">{data.video.title}</h6>
        <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="d-flex gap-4">
        <div>👀 Total: {data.total_views}</div>
        <div>👤 Members: {data.member_views}</div>
        <div>🕶 Guests: {data.guest_views}</div>
      </div>
    </div>
  );
}
*/}