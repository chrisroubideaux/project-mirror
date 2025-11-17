// components/camera/WebcamPanel.tsx
'use client';
import { useRef, useState } from 'react';

interface Props { onCapture: (blob: Blob) => void; }

export default function WebcamPanel({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      setReady(true);
    }
  };

  const captureFrame = () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => blob && onCapture(blob), 'image/jpeg');
  };

  return (
    <div className="card bg-dark border-secondary p-3">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="rounded w-100"
        style={{ maxHeight: '280px', objectFit: 'cover' }}
      />
      <div className="d-flex justify-content-center mt-3">
        {!ready ? (
          <button className="btn btn-outline-info" onClick={startCamera}>Start Camera</button>
        ) : (
          <button className="btn btn-outline-light" onClick={captureFrame}>Capture Frame</button>
        )}
      </div>
    </div>
  );
}

