// components/emotes/EmpathyMeter.tsx
'use client';

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';

interface Props { score: number; }

export default function EmpathyMeter({ score }: Props) {
  const percent = Math.round(score * 100);
  return (
    <div className="mx-auto mt-4" style={{ width: '150px' }}>
      <CircularProgressbar
        value={percent}
        text={`${percent}%`}
        styles={buildStyles({
          textColor: '#fff',
          pathColor: `rgba(0, 123, 255, ${score})`,
          trailColor: '#2b2b2b',
        })}
      />
      <p className="mt-3 text-light">Empathy Score</p>
    </div>
  );
}

