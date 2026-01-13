// components/profile/Login.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function Login() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [faceLoading, setFaceLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // ---------------------------------------------------
  // OAuth Handlers
  // ---------------------------------------------------
  const handleGoogleLogin = () => {
    toast.info('Redirecting to Google...');
    window.location.href = `${API_BASE}/auth/google/login`;
  };

  const handleFacebookLogin = () => {
    toast.info('Redirecting to Facebook...');
    window.location.href = `${API_BASE}/auth/facebook/login`;
  };

  // ---------------------------------------------------
  // Capture Frame (TS-SAFE)
  // ---------------------------------------------------
  const captureFrame = (): Promise<Blob> => {
    return new Promise<Blob>((resolve, reject) => {
      const video = videoRef.current;

      if (!video) {
        reject(new Error('Video not ready'));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(video, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to capture image'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  };

  // ---------------------------------------------------
  // Face Login Logic
  // ---------------------------------------------------
  const handleFaceLogin = async () => {
    try {
      setFaceLoading(true);
      setShowCamera(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Capture two frames for liveness
      const image1 = await captureFrame();
      await new Promise((r) => setTimeout(r, 800));
      const image2 = await captureFrame();

      // Stop camera
      stream.getTracks().forEach((t) => t.stop());
      setShowCamera(false);

      // Send to backend
      const formData = new FormData();
      formData.append('image1', image1);
      formData.append('image2', image2);

      const res = await fetch(`${API_BASE}/api/face/login`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.reason === 'no_liveness_detected') {
          toast.error('Please move slightly and try again.');
        } else if (data.reason === 'no_face_detected') {
          toast.error('Face not detected. Try better lighting.');
        } else {
          toast.error('Face login failed.');
        }
        setFaceLoading(false);
        return;
      }

      // Success
      localStorage.setItem('aurora_token', data.token);
      toast.success('Face login successful!');

      window.location.href = `/profile/${data.user.id}`;
    } catch (err) {
      console.error(err);
      toast.error('Camera access denied or unavailable.');
      setShowCamera(false);
    } finally {
      setFaceLoading(false);
    }
  };

  // ---------------------------------------------------
  // OAuth Redirect Handling
  // ---------------------------------------------------
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    const userId = url.searchParams.get('id');

    if (token) {
      localStorage.setItem('aurora_token', token);
      toast.success('Login successful!');
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.href = userId ? `/profile/${userId}` : `/profile`;
    }
  }, []);

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  return (
    <div className="container py-5 d-flex flex-column gap-4 align-items-center">
      <motion.h1
        className="fw-bold text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Welcome to Project Aurora
      </motion.h1>

      {/* Face Login */}
      <button
        onClick={handleFaceLogin}
        disabled={faceLoading}
        className="btn btn-outline-light rounded-pill px-4 py-2"
      >
        {faceLoading ? 'Scanning Face…' : 'Login with Face Recognition'}
      </button>

      {showCamera && (
        <video
          ref={videoRef}
          className="mt-3 rounded shadow"
          style={{ width: 260 }}
          muted
          playsInline
        />
      )}

      <hr style={{ width: '50%', opacity: 0.1 }} />

      {/* Google */}
      <button
        onClick={handleGoogleLogin}
        className="btn btn-light w-100 rounded-pill shadow-sm fw-semibold d-flex align-items-center justify-content-center gap-2"
      >
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
          width={22}
          height={22}
        />
        Continue with Google
      </button>

      {/* Facebook */}
      <button
        onClick={handleFacebookLogin}
        className="btn btn-primary w-100 rounded-pill shadow-sm fw-semibold d-flex align-items-center justify-content-center gap-2"
        style={{ background: '#1877F2' }}
      >
        <img
          src="https://www.svgrepo.com/show/452196/facebook-1.svg"
          alt="Facebook"
          width={22}
          height={22}
        />
        Continue with Facebook
      </button>
    </div>
  );
}


{/*
'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function Login() {
  // ---------------------------------------------------
  // Handlers
  // ---------------------------------------------------
  const handleGoogleLogin = () => {
    toast.info('Redirecting to Google...');
    window.location.href = `${API_BASE}/auth/google/login`;
  };

  const handleFacebookLogin = () => {
    toast.info('Redirecting to Facebook...');
    window.location.href = `${API_BASE}/auth/facebook/login`;
  };

  const handleFaceLogin = () => {
    toast.info('Face login coming soon...');
  };

  // ---------------------------------------------------
  // Handle OAuth Redirects
  // ---------------------------------------------------
  useEffect(() => {
    const url = new URL(window.location.href);

    const token = url.searchParams.get('token');
    const userId = url.searchParams.get('id');

    if (token) {
      // Save token locally
      localStorage.setItem('aurora_token', token);

      toast.success('Login successful!');

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Redirect
      window.location.href = userId
        ? `/profile/${userId}`
        : `/profile`;
    }
  }, []);

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  return (
    <div className="container py-5 d-flex flex-column gap-4 align-items-center">

      <motion.h1
        className="fw-bold text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Welcome to Project Aurora
      </motion.h1>

     
      <button
        onClick={handleFaceLogin}
        className="btn btn-outline-light rounded-pill px-4 py-2"
      >
        Login with Face Recognition
      </button>

      <hr style={{ width: '50%', opacity: 0.1 }} />

    
      <button
        onClick={handleGoogleLogin}
        className="btn btn-light w-100 rounded-pill shadow-sm fw-semibold d-flex align-items-center justify-content-center gap-2"
      >
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
          width={22}
          height={22}
        />
        Continue with Google
      </button>

    
      <button
        onClick={handleFacebookLogin}
        className="btn btn-primary w-100 rounded-pill shadow-sm fw-semibold d-flex align-items-center justify-content-center gap-2"
        style={{ background: '#1877F2' }}
      >
        <img
          src="https://www.svgrepo.com/show/452196/facebook-1.svg"
          alt="Facebook"
          width={22}
          height={22}
        />
        Continue with Facebook
      </button>
    </div>
  );
}

*/}
