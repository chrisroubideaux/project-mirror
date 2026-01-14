// components/admin/AuroraParticles.tsx
'use client';

import React from 'react';

const PARTICLE_COUNT = 70; // ⬅️ increase this (30 → 70)

export default function AuroraParticles() {
  return (
    <div className="aurora-particles">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const x = Math.random();             // horizontal position (0–1)
        const d = Math.random() * 25 + 10;   // animation duration variance
        const size = Math.random() * 6 + 2;  // 2px–8px (slightly tighter)

        return (
          <span
            key={i}
            style={
              {
                '--x': x,
                '--d': `${d}s`,
                width: `${size}px`,
                height: `${size}px`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}


{/*
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
*/}