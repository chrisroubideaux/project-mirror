// components/admin/aurora/AuroraPersonalityCard.tsx
'use client';

type Props = {
  snapshot: any;
};

export default function AuroraPersonalityCard({ snapshot }: Props) {
  const p = snapshot.personality;

  const percent = Math.round(p.adaptive_score * 100);

  return (
    <div className="card aurora-card mb-4 p-4">
      <h6 className="mb-3">Personality State</h6>

      <div>Tone: {p.tone}</div>
      <div>Verbosity: {p.verbosity}</div>
      <div>Depth: {p.probing_depth}</div>

      <div className="mt-3">
        <div className="small text-muted">Adaptive Score</div>
        <div className="progress" style={{ height: 8 }}>
          <div
            className="progress-bar"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="small mt-1">{percent}%</div>
      </div>
    </div>
  );
}