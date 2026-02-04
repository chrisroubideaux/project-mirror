// components/profile/home/FeaturedTrailer.tsx

'use client';

export default function FeaturedTrailer() {
  return (
    <div
      className="rounded-4 overflow-hidden position-relative"
      style={{
        height: 320,
        background: '#111',
        border: '1px solid var(--aurora-bento-border)',
      }}
    >
      <div
        className="position-absolute bottom-0 start-0 w-100 p-4"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
        }}
      >
        <h3 className="fw-light mb-1">
          Projekt Aurora
        </h3>
        <p className="mb-2 small">
          A glimpse into the multiverse.
        </p>

        <button className="btn btn-sm btn-primary">
          ▶ Watch Trailer
        </button>
      </div>
    </div>
  );
}
