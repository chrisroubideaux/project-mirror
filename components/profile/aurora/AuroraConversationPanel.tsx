// components/profile/aurora/AuroraConversationPanel.tsx 

// components/profile/aurora/AuroraConversationPanel.tsx
"use client";

import { useMemo, useState } from "react";
import type { AuroraChatMessage } from "./types";

type Props = {
  messages: AuroraChatMessage[];
  mode: "idle" | "thinking" | "speaking" | "settling";
  onSend: (text: string) => void;
  onEndSession?: () => void;
};

export default function AuroraConversationPanel({ messages, mode, onSend, onEndSession }: Props) {
  const [text, setText] = useState("");

  const canSend = useMemo(() => text.trim().length > 0 && mode !== "thinking", [text, mode]);

  return (
    <div
      style={{
        position: "relative",
        width: "min(820px, 92vw)",
        height: "min(560px, 78vh)",
        borderRadius: 18,
        border: "1px solid rgba(120,180,255,0.18)",
        background: "rgba(10, 12, 18, 0.55)",
        backdropFilter: "blur(18px)",
        boxShadow: "0 14px 60px rgba(0,0,0,0.45)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid rgba(120,180,255,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background:
                mode === "speaking"
                  ? "rgba(100,255,210,0.95)"
                  : mode === "thinking"
                  ? "rgba(255,210,120,0.95)"
                  : "rgba(160,180,255,0.7)",
              boxShadow: "0 0 18px rgba(120,180,255,0.35)",
            }}
          />
          <div style={{ color: "rgba(240,245,255,0.92)", fontWeight: 600 }}>
            Aurora
            <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.75, fontWeight: 400 }}>
              {mode === "thinking"
                ? "thinking…"
                : mode === "speaking"
                ? "speaking"
                : mode === "settling"
                ? "settling"
                : "here"}
            </span>
          </div>
        </div>

        {onEndSession && (
          <button
            type="button"
            onClick={onEndSession}
            className="btn btn-sm btn-outline-light"
            style={{ opacity: 0.85 }}
          >
            End session
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          padding: 14,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ opacity: 0.75, color: "rgba(240,245,255,0.82)", lineHeight: 1.5 }}>
            Aurora is online. Say something to begin.
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "78%",
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(120,180,255,0.12)",
                background:
                  m.role === "user" ? "rgba(120,180,255,0.14)" : "rgba(255,255,255,0.06)",
                color: "rgba(240,245,255,0.92)",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div
        style={{
          padding: 12,
          borderTop: "1px solid rgba(120,180,255,0.12)",
          display: "flex",
          gap: 10,
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message Aurora…"
          className="form-control"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(120,180,255,0.16)",
            color: "rgba(240,245,255,0.92)",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) {
                const t = text.trim();
                setText("");
                onSend(t);
              }
            }
          }}
        />

        <button
          type="button"
          className="btn btn-light"
          disabled={!canSend}
          onClick={() => {
            const t = text.trim();
            if (!t) return;
            setText("");
            onSend(t);
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}