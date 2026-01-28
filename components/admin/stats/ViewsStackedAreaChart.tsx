// components/admin/stats/ViewsStackedAreaChart.tsx

'use client';

import {
  AreaChart,
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
  guest: number;
  member: number;
};

type RangeKey = '7' | '30' | 'all';

type Props = {
  videoId: string;
};

export default function ViewsStackedAreaChart({ videoId }: Props) {
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
      `${API_BASE}/api/videos/admin/video/${videoId}/views/daily/stacked${daysParam}`,
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
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
                background: range === r ? 'rgba(0,224,255,0.15)' : 'transparent',
                color: range === r ? '#00e0ff' : '#9aa0a6',
              }}
            >
              {r === 'all' ? 'All' : `${r}d`}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 200 }}>
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

            <XAxis dataKey="date" hide />
            <YAxis hide />

            <Tooltip
              formatter={(value?: number, name?: string) => [
                `${value ?? 0} views`,
                name === 'guest' ? 'Guest' : 'Member',
              ]}
            />

            <Area
              type="monotone"
              dataKey="guest"
              stackId="1"
              stroke="#6876f7"
              fill="url(#guestFill)"
            />
            <Area
              type="monotone"
              dataKey="member"
              stackId="1"
              stroke="#00e0ff"
              fill="url(#memberFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
