// components/audio/AudioRecorder.tsx
'use client';
import { useState, useRef } from 'react';

interface Props { onRecordComplete: (blob: Blob) => void; }

export default function AudioRecorder({ onRecordComplete }: Props) {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: 'audio/wav' });
      audioChunks.current = [];
      onRecordComplete(blob);
    };
    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
  };

  return (
    <div className="card bg-dark border-secondary p-4">
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`btn btn-lg ${recording ? 'btn-danger' : 'btn-success'}`}
      >
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  );
}
