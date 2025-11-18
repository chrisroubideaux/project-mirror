'use client';

import { useRef, useState } from 'react';

interface Props {
  onComplete: (data: { imageBlob: Blob; audioBlob: Blob }) => void;
}

export default function HybridRecorder({ onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [recording, setRecording] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // --------------------------------------------------
  // START RECORDING (camera + microphone)
  // --------------------------------------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Attach live video preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Setup audio recorder
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);

      recorder.start();
      setAudioRecorder(recorder);
      setRecording(true);
    } catch (err) {
      console.error("Error starting hybrid recorder:", err);
      alert("Could not access camera/microphone.");
    }
  };

  // --------------------------------------------------
  // STOP RECORDING + CAPTURE FINAL FRAME
  // --------------------------------------------------
  const stopRecording = () => {
    if (!audioRecorder || !videoRef.current) return;

    audioRecorder.stop();
    setRecording(false);

    audioRecorder.onstop = () => {
      // Create final audio blob
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
      audioChunks.current = [];

      // Capture image from final frame
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      if (!video) {
        console.error('Video element is not available.');
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);

      canvas.toBlob((imageBlob) => {
        if (imageBlob) {
          onComplete({ imageBlob, audioBlob });
        }
      }, 'image/jpeg');
    };

    // Stop all media tracks
    const stream = videoRef.current.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
  };

  return (
    <div className="card bg-dark border-secondary p-4 text-center">

      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="rounded w-100 mb-3"
        style={{ maxHeight: '320px', objectFit: 'cover' }}
      />

      {/* Start / Stop buttons */}
      {!recording ? (
        <button
          className="btn btn-success btn-lg"
          onClick={startRecording}
        >
          🎥 Start Hybrid Recording
        </button>
      ) : (
        <button
          className="btn btn-danger btn-lg"
          onClick={stopRecording}
        >
          ⏹ Stop & Capture
        </button>
      )}

    </div>
  );
}

