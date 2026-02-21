// components/admin/aurora/AuroraTrustEngagementChart.tsx

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Props = {
  snapshot: any;
};

export default function AuroraTrustEngagementChart({ snapshot }: Props) {
  const engagement =
    snapshot.engagement_trend?.map((v: number, i: number) => ({
      session: i + 1,
      engagement: v,
      trust: snapshot.relationship.trust_score,
    })) || [];

  return (
    <div className="card aurora-card mb-4 p-4">
      <h6 className="mb-3">Trust vs Engagement</h6>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={engagement}>
          <XAxis dataKey="session" />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Line type="monotone" dataKey="engagement" strokeWidth={2} />
          <Line type="monotone" dataKey="trust" strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}