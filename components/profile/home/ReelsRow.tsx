// components/profile/home/ReelsRow.tsx

'use client';

export default function ReelsRow() {
  return (
    <div>
      <h5 className="fw-light mb-3">Reels</h5>

      <div
        className="d-flex gap-3 overflow-auto pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              minWidth: 160,
              height: 280,
              borderRadius: 14,
              background: '#222',
              scrollSnapAlign: 'start',
            }}
          />
        ))}
      </div>
    </div>
  );
}
