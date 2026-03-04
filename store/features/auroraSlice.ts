// store/features/auroraSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AuroraMode = "idle" | "thinking" | "speaking" | "settling";

export type AuroraRole = "user" | "assistant";

export type AuroraMessage = {
  id: string;
  role: AuroraRole;
  content: string;
  createdAt: number;
  meta?: Record<string, any>;
};

export type PAD = {
  valence: number; // 0..1 (baseline model)
  arousal: number; // 0..1
  dominance: number; // 0..1
};

export type AuroraRelationshipState = {
  trust: number; // 0..100
  familiarity: number; // 0..100
  interactionCount: number;
  voiceEnabled: boolean;
  prefersConcise: boolean;
  safetyFlagTriggered: boolean;
};

export type AuroraPersonalityEffective = {
  tone: string;
  verbosity: string;
  pace: string;
  directness: string;
  probing_depth: string;
  adaptive_score: number;
  user_overrides?: Record<string, any>;
};

export type AuroraTrends = {
  window: number;
  count: number;
  avg_engagement: number; // 0..1
  dominant_emotion_mode: string;
  risk_rate: number; // 0..1
  top_themes: string[];
};

export type AuroraState = {
  hydrated: boolean;
  sessionId: string | null;
  mode: AuroraMode;

  relationship: AuroraRelationshipState | null;
  personalityEffective: AuroraPersonalityEffective | null;
  trends: AuroraTrends | null;

  baselineTarget: PAD; // derived from relationship/trends
  liveTarget: PAD | null; // from /converse emotion PAD (if available)

  audioUrl: string | null;
  isPlaying: boolean;

  messages: AuroraMessage[];

  // for UX
  lastError: string | null;
  lastUpdatedAt: number | null;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const clamp100 = (n: number) => Math.max(0, Math.min(100, n));

export const AURORA_PERSIST_KEY = "aurora-redux-state:v1";

export const defaultPAD: PAD = {
  valence: 0.55,
  arousal: 0.35,
  dominance: 0.55,
};

const initialState: AuroraState = {
  hydrated: false,
  sessionId: null,
  mode: "idle",

  relationship: null,
  personalityEffective: null,
  trends: null,

  baselineTarget: defaultPAD,
  liveTarget: null,

  audioUrl: null,
  isPlaying: false,

  messages: [],

  lastError: null,
  lastUpdatedAt: null,
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadAuroraStateFromStorage(): Partial<AuroraState> | null {
  if (typeof window === "undefined") return null;
  const saved = safeParse<Partial<AuroraState>>(localStorage.getItem(AURORA_PERSIST_KEY));
  if (!saved) return null;

  // Defensive cleanup: avoid persisting transient playback state on reload
  return {
    ...saved,
    hydrated: true,
    isPlaying: false,
    mode: saved.mode === "speaking" ? "idle" : saved.mode ?? "idle",
  };
}

export function saveAuroraStateToStorage(state: AuroraState) {
  if (typeof window === "undefined") return;
  try {
    // Persist only what matters. Keep it stable + compact.
    const payload: Partial<AuroraState> = {
      sessionId: state.sessionId,
      mode: state.mode,

      relationship: state.relationship,
      personalityEffective: state.personalityEffective,
      trends: state.trends,

      baselineTarget: state.baselineTarget,
      liveTarget: state.liveTarget,

      audioUrl: state.audioUrl,
      // isPlaying intentionally excluded (transient)

      messages: state.messages,

      lastError: state.lastError,
      lastUpdatedAt: state.lastUpdatedAt,
    };

    localStorage.setItem(AURORA_PERSIST_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export function clearAuroraStateStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AURORA_PERSIST_KEY);
  } catch {}
}

const auroraSlice = createSlice({
  name: "aurora",
  initialState,
  reducers: {
    hydrateFromStorage(state, action: PayloadAction<Partial<AuroraState> | null>) {
      const payload = action.payload;
      if (!payload) {
        state.hydrated = true;
        return;
      }
      // merge carefully
      state.hydrated = true;
      state.sessionId = payload.sessionId ?? state.sessionId;
      state.mode = (payload.mode as AuroraMode) ?? state.mode;

      state.relationship = payload.relationship ?? state.relationship;
      state.personalityEffective = payload.personalityEffective ?? state.personalityEffective;
      state.trends = payload.trends ?? state.trends;

      state.baselineTarget = payload.baselineTarget ?? state.baselineTarget;
      state.liveTarget = payload.liveTarget ?? state.liveTarget;

      state.audioUrl = payload.audioUrl ?? state.audioUrl;
      state.isPlaying = false; // always reset

      state.messages = Array.isArray(payload.messages) ? payload.messages : state.messages;

      state.lastError = payload.lastError ?? null;
      state.lastUpdatedAt = payload.lastUpdatedAt ?? state.lastUpdatedAt;
    },

    setSessionId(state, action: PayloadAction<string | null>) {
      state.sessionId = action.payload;
      state.lastUpdatedAt = Date.now();
    },

    setMode(state, action: PayloadAction<AuroraMode>) {
      state.mode = action.payload;
      state.lastUpdatedAt = Date.now();
    },

    setRelationship(
      state,
      action: PayloadAction<{
        trust: number;
        familiarity: number;
        interactionCount: number;
        voiceEnabled?: boolean;
        prefersConcise?: boolean;
        safetyFlagTriggered?: boolean;
      }>
    ) {
      const p = action.payload;
      state.relationship = {
        trust: clamp100(p.trust),
        familiarity: clamp100(p.familiarity),
        interactionCount: Math.max(0, p.interactionCount),
        voiceEnabled: p.voiceEnabled ?? state.relationship?.voiceEnabled ?? true,
        prefersConcise: p.prefersConcise ?? state.relationship?.prefersConcise ?? false,
        safetyFlagTriggered: p.safetyFlagTriggered ?? state.relationship?.safetyFlagTriggered ?? false,
      };
      state.lastUpdatedAt = Date.now();
    },

    setPersonalityEffective(state, action: PayloadAction<AuroraPersonalityEffective | null>) {
      state.personalityEffective = action.payload;
      state.lastUpdatedAt = Date.now();
    },

    setTrends(state, action: PayloadAction<AuroraTrends | null>) {
      state.trends = action.payload;
      state.lastUpdatedAt = Date.now();
    },

    setBaselineTarget(state, action: PayloadAction<PAD>) {
      state.baselineTarget = {
        valence: clamp01(action.payload.valence),
        arousal: clamp01(action.payload.arousal),
        dominance: clamp01(action.payload.dominance),
      };
      state.lastUpdatedAt = Date.now();
    },

    setLiveTarget(state, action: PayloadAction<PAD | null>) {
      state.liveTarget = action.payload
        ? {
            valence: clamp01(action.payload.valence),
            arousal: clamp01(action.payload.arousal),
            dominance: clamp01(action.payload.dominance),
          }
        : null;
      state.lastUpdatedAt = Date.now();
    },

    setAudioUrl(state, action: PayloadAction<string | null>) {
      state.audioUrl = action.payload;
      state.lastUpdatedAt = Date.now();
    },

    setAudioPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload;
      state.lastUpdatedAt = Date.now();
    },

    addMessage(state, action: PayloadAction<AuroraMessage>) {
      state.messages.push(action.payload);
      // cap to avoid unbounded growth
      if (state.messages.length > 300) state.messages.splice(0, state.messages.length - 300);
      state.lastUpdatedAt = Date.now();
    },

    clearMessages(state) {
      state.messages = [];
      state.lastUpdatedAt = Date.now();
    },

    setError(state, action: PayloadAction<string | null>) {
      state.lastError = action.payload;
      state.lastUpdatedAt = Date.now();
    },

    resetAurora(state) {
      // keep hydrated true if we were already hydrated
      const wasHydrated = state.hydrated;
      Object.assign(state, initialState);
      state.hydrated = wasHydrated || true;
      state.lastUpdatedAt = Date.now();
    },
  },
});

export const auroraActions = auroraSlice.actions;
export default auroraSlice.reducer;