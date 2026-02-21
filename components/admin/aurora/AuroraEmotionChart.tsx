// components/admin/aurora/AuroraEmotionChart.tsx
'use client';

import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';

type Props = {
  snapshot: any;
};

const COLORS = [
  '#6C8EFF', // soft blue
  '#4FD1C5', // teal
  '#F6AD55', // orange
  '#FC8181', // red
  '#B794F4', // purple
  '#90CDF4', // light blue
];

export default function AuroraEmotionChart({ snapshot }: Props) {
  const emotionDistribution = snapshot?.emotion_distribution;

  if (!emotionDistribution) return null;

  const data = Object.entries(emotionDistribution).map(
    ([emotion, count]) => ({
      name: emotion,
      value: count,
    })
  );

  return (
    <div className="card aurora-card mb-4 p-4">
      <h6 className="mb-3">Emotion Distribution</h6>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={90}
            innerRadius={40}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              background: 'var(--card-bg)',
              border: '1px solid var(--aurora-bento-border)',
              color: 'var(--foreground)',
            }}
          />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}