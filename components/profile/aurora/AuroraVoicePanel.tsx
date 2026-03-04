'use client';

import { useState } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';

type Props = {
  onTranscript: (text: string) => void;
  listening: boolean;
  setListening: (v: boolean) => void;
};

export default function AuroraVoicePanel({
  onTranscript,
  listening,
  setListening,
}: Props) {
  const [preview, setPreview] = useState('');

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPreview(transcript);
    };

    recognition.onend = () => {
      setListening(false);

      if (preview.trim().length > 0) {
        onTranscript(preview);
        setPreview('');
      }
    };

    recognition.start();
  };

  return (
    <div
      style={{
        position: 'relative',
        width: 'min(520px, 90vw)',
        padding: 24,
        borderRadius: 20,
        backdropFilter: 'blur(18px)',
        background: 'rgba(12,14,20,0.6)',
        border: '1px solid rgba(120,180,255,0.15)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          marginBottom: 12,
          fontSize: 14,
          opacity: 0.7,
        }}
      >
        {listening ? 'Listening…' : 'Tap the microphone to speak'}
      </div>

      <button
        onClick={startListening}
        style={{
          width: 70,
          height: 70,
          borderRadius: '50%',
          border: 'none',
          background: listening
            ? 'linear-gradient(135deg,#ff4d4d,#ff7b7b)'
            : 'linear-gradient(135deg,#7df9ff,#7f5af0)',
          color: 'white',
          fontSize: 22,
          boxShadow: '0 0 24px rgba(120,180,255,0.35)',
        }}
      >
        {listening ? <FaStop /> : <FaMicrophone />}
      </button>

      {preview && (
        <div
          style={{
            marginTop: 18,
            fontSize: 14,
            opacity: 0.8,
          }}
        >
          "{preview}"
        </div>
      )}
    </div>
  );
}