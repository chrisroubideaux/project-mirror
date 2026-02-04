// components/profile/home/ContinueWatching.tsx
// components/profile/home/ContinueWatching.tsx
'use client';

export default function ContinueWatching() {
  return (
    <div
      className="p-4 rounded-4"
      style={{
        background: 'var(--aurora-bento-bg)',
        border: '1px solid var(--aurora-bento-border)',
      }}
    >
      <h5 className="fw-light mb-3">Continue Watching</h5>

      <div
        className="d-flex gap-3 align-items-center"
        style={{ cursor: 'pointer' }}
      >
        <div
          style={{
            width: 220,
            height: 120,
            borderRadius: 12,
            background: '#222',
          }}
        />

        <div className="flex-grow-1">
          <div className="fw-semibold">Projekt Aurora – Trailer</div>
          <div className="small text-muted mb-2">
            42% watched
          </div>

          <div
            style={{
              height: 4,
              width: '100%',
              background: '#333',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '42%',
                height: '100%',
                background: 'var(--accent)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
