// components/profile/home/VideoCard.tsx

'use client';

export default function VideoCard() {
  return (
    <div
      className="rounded-4 overflow-hidden"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--aurora-bento-border)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          height: 160,
          background: '#222',
        }}
      />

      <div className="p-3">
        <div className="fw-semibold mb-1">
          Aurora: Episode One
        </div>
        <div className="small text-muted">
          12k views · 2 days ago
        </div>
      </div>
    </div>
  );
}
