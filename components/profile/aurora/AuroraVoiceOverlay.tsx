'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  userName: string;
  token: string;
  onClose: () => void;
};

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export default function AuroraVoiceOverlay({
  userName,
  token,
  onClose
}: Props) {

  const recognitionRef = useRef<any>(null);
  const sessionId = useRef<string>(crypto.randomUUID());

  const [listening, setListening] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = true;

    rec.onresult = async (event: any) => {

      const text =
        event.results[event.results.length - 1][0].transcript;

      console.log("User said:", text);

      const res = await fetch(`${API}/api/user/aurora/converse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          session_id: sessionId.current
        })
      });

      const data = await res.json();

      if (data.audio_url) {
        const audio = new Audio(data.audio_url);
        audioRef.current = audio;
        audio.play();
      }

    };

    recognitionRef.current = rec;

    return () => {
      rec.stop();
    };

  }, [token]);

  const startListening = () => {
    recognitionRef.current.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current.stop();
    setListening(false);
  };

  useEffect(() => {
    // greeting
    const greet = new SpeechSynthesisUtterance(
      `Hello ${userName}. I'm Aurora.`
    );
    speechSynthesis.speak(greet);
  }, [userName]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "black",
        zIndex: 99999
      }}
    >

      {/* CLOSE BUTTON */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 25,
          right: 25,
          fontSize: 26,
          background: "transparent",
          border: "none",
          color: "white",
          cursor: "pointer"
        }}
      >
        ✕
      </button>

      {/* PARTICLE CANVAS */}
      <canvas
        id="aurora-canvas"
        style={{
          position: "absolute",
          inset: 0
        }}
      />

      {/* CENTER MIC */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          color: "white"
        }}
      >

        <button
          onClick={listening ? stopListening : startListening}
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "none",
            background: listening ? "#ff3b3b" : "#00d0ff",
            fontSize: 40,
            cursor: "pointer"
          }}
        >
          🎤
        </button>

      </div>
    </div>
  );
}