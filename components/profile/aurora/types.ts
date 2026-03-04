// components/profile/aurora/types.ts
export type AuroraMode = "idle" | "thinking" | "speaking" | "settling";

export type PAD = {
  valence: number;   // 0..1
  arousal: number;   // 0..1
  dominance: number; // 0..1
};

export type AuroraChatRole = "user" | "assistant";

export type AuroraChatMessage = {
  id: string;
  role: AuroraChatRole;
  content: string;
  createdAt: number;
};

export type ConverseResponse = {
  session_id: string;
  relationship: {
    familiarity_score: number;
    trust_score: number;
    interaction_count: number;
  };
  guardrail: {
    triggered: boolean;
    category: string | null;
    severity: "low" | "med" | "high";
  };
  emotion?: {
    valence?: number;
    arousal?: number;
    dominance?: number;
    [k: string]: any;
  };
  assistant_reply: string;
  audio_url?: string | null;
  usage?: Record<string, any>;
};