// components/profile/aurora/utils/particleMapping.ts

import type { PAD } from "../types";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function mapPADToVisual(pad: PAD) {
  // Hue: valence -> cooler to warmer
  const hue = 195 + (pad.valence - 0.5) * 80; // ~155..235
  const glow = clamp(0.18 + pad.arousal * 0.55, 0.12, 0.85);
  const speed = clamp(0.00035 + pad.arousal * 0.0012, 0.00025, 0.0020);
  const tightness = clamp(0.20 + pad.dominance * 0.90, 0.20, 1.10);

  return { hue, glow, speed, tightness };
}
