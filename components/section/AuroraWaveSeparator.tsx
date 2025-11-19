// components/section/AuroraWaveSeparator.tsx
'use client';

export default function AuroraWaveSeparator() {
  return (
    <div
      style={{
        width: "100%",
        height: "140px",
        background:
          "linear-gradient(180deg, rgba(0,183,255,0.2), rgba(168,85,247,0.2), rgba(0,255,200,0.2))",
        maskImage:
          "radial-gradient(70% 120% at 50% 0%, black 60%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(70% 120% at 50% 0%, black 60%, transparent 100%)",
      }}
    />
  );
}
