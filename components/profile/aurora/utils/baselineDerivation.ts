// components/profile/aurora/utils/baselineDerivation.ts

import type { PAD } from "../types";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function deriveBaselinePAD(params: {
  trustScore?: number;        // 0..100
  familiarityScore?: number;  // 0..100
  avgEngagement?: number;     // 0..1
  adaptiveScore?: number;     // 0..1
}): PAD {
  const trust = clamp01((params.trustScore ?? 35) / 100);
  const fam = clamp01((params.familiarityScore ?? 35) / 100);
  const eng = clamp01(params.avgEngagement ?? 0.55);
  const adapt = clamp01(params.adaptiveScore ?? 0.1);

  // Presence model:
  // - Valence rises with trust, slightly with engagement
  // - Dominance rises with familiarity (comfort) + a tiny adaptive contribution
  // - Arousal is mostly engagement, but slightly tempered by trust
  const valence = clamp01(0.15 + 0.65 * trust + 0.20 * eng);
  const dominance = clamp01(0.20 + 0.65 * fam + 0.15 * adapt);
  const arousal = clamp01(0.10 + 0.70 * eng + 0.10 * (1 - trust));

  return { valence, arousal, dominance };
}