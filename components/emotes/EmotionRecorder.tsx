// components/emotes/EmotionRecorder.tsx
'use client';

import { useRef, useState } from 'react';

interface Props {
  onComplete: (data: { imageBlob: Blob; audioBlob: Blob }) => void;
}

export default function EmotionRecorder({ onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [recording, setRecording] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // ------------------------------
  // Start both camera + mic
  // ------------------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // attach video stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // prepare audio recorder
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);

      recorder.start();
      setAudioRecorder(recorder);
      setRecording(true);
    } catch (err) {
      console.error("Camera/Mic error:", err);
      alert("Could not start camera/microphone.");
    }
  };

  // ------------------------------
  // Stop mic + capture final frame
  // ------------------------------
  const stopRecording = () => {
    const video = videoRef.current;
    if (!audioRecorder || !video) return;

    // Stop audio
    audioRecorder.stop();
    setRecording(false);

    audioRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
      audioChunks.current = [];

      // capture frame from video
      const canvas = document.createElement('canvas');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
      }

      canvas.toBlob((imageBlob) => {
        if (imageBlob) {
          onComplete({ imageBlob, audioBlob });
        }
      }, 'image/jpeg');
    };

    // also stop the camera stream
    const stream = video.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
  };

  return (
    <div className="card bg-dark border-secondary p-4 text-center">
      {/* VIDEO FEED */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="rounded w-100 mb-3"
        style={{ maxHeight: '300px', objectFit: 'cover' }}
      />

      {/* BUTTONS */}
      {!recording ? (
        <button className="btn btn-success btn-lg" onClick={startRecording}>
          🎥 Start Recording
        </button>
      ) : (
        <button className="btn btn-danger btn-lg" onClick={stopRecording}>
          ⏹ Stop & Analyze
        </button>
      )}
    </div>
  );
}
