// components/admin/aurora/AuroraMemoryChart.tsx

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Props = {
  snapshot: any;
};

export default function AuroraMemoryChart({ snapshot }: Props) {
  const memory = snapshot.memory_summary;

  if (!memory) return null;

  const data =
    memory.strongest_keys?.map(([key, count]: any) => ({
      key,
      count,
    })) || [];

  return (
    <div className="card aurora-card mb-4 p-4">
      <h6 className="mb-3">Memory Reinforcement</h6>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="key" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 small text-muted">
        Avg Confidence: {memory.avg_confidence}
      </div>
    </div>
  );
}