// components/profile/aurora/utils/emotionBlend.ts

import type { PAD } from "../types";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function blendHybrid(baseline: PAD, live: PAD | null, audioEnergy: number): PAD {
  const a = clamp01(audioEnergy);

  const b = baseline;
  const l = live ?? baseline;

  // hybrid weights
  const valence = clamp01(0.35 * b.valence + 0.65 * l.valence);
  const dominance = clamp01(0.55 * b.dominance + 0.45 * l.dominance);

  // audio boosts arousal only
  const arousal = clamp01((0.25 * b.arousal + 0.75 * l.arousal) + a * 0.30);

  return { valence, arousal, dominance };
}