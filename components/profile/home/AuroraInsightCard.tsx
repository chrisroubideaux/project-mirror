// components/profile/home/AuroraInsightCard.tsx

'use client';

export default function AuroraInsightCard() {
  return (
    <div
      className="p-4 rounded-4"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e, #111)',
        border: '1px solid var(--aurora-bento-border)',
      }}
    >
      <div className="small text-muted mb-1">
        Aurora Insight
      </div>

      <div className="fw-light">
        You tend to explore reflective content late at night.
        Want something calm or something curious?
      </div>
    </div>
  );
}

