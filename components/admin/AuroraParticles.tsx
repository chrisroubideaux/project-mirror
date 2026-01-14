// components/admin/AuroraParticles.tsx
'use client';

import React from 'react';

export default function AuroraParticles() {
  return (
    <div className="aurora-particles">
      {Array.from({ length: 30 }).map((_, i) => {
        const x = Math.random();          // horizontal position (0–1)
        const d = Math.random() * 20;     // animation variance
        const size = Math.random() * 6 + 3; // 3px–9px

        return (
          <span
            key={i}
            style={{
              '--x': x,
              '--d': `${d}s`,
              width: `${size}px`,
              height: `${size}px`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
