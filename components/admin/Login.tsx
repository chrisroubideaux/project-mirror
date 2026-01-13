// app/admin/Login.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN_KEY = 'aurora_admin_token';

export default function AdminLogin() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [faceLoading, setFaceLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleGoogleLogin = () => {
    toast.info('Redirecting to Google...');
    window.location.href = `${API_BASE}/auth/admin/google/login`;
  };

  const handleFacebookLogin = () => {
    toast.info('Redirecting to Facebook...');
    window.location.href = `${API_BASE}/auth/admin/facebook/login`;
  };

  const captureFrame = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = videoRef.current;
      if (!video) return reject(new Error('Video not ready'));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));

      ctx.drawImage(video, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Capture failed'));
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  };

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

      const image1 = await captureFrame();
      await new Promise((r) => setTimeout(r, 800));
      const image2 = await captureFrame();

      stream.getTracks().forEach((t) => t.stop());
      setShowCamera(false);

      const formData = new FormData();
      formData.append('image1', image1);
      formData.append('image2', image2);

      const res = await fetch(`${API_BASE}/api/admin/face/login`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.reason || 'Admin face login failed');
        return;
      }

      // support either admin_id or user.id depending on your backend response
      const adminId = data.admin_id || data?.user?.id;

      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      toast.success('Admin face login successful');

      router.replace(adminId ? `/admin/${adminId}` : '/admin/login');
    } catch (err) {
      console.error(err);
      toast.error('Camera access failed');
    } finally {
      setFaceLoading(false);
    }
  };

  // OAuth redirect handling (supports multiple param names)
  useEffect(() => {
    const url = new URL(window.location.href);

    const token =
      url.searchParams.get('admin_token') ||
      url.searchParams.get('token');

    const adminId =
      url.searchParams.get('admin_id') ||
      url.searchParams.get('id');

    if (token && adminId) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      toast.success('Admin login successful');

      window.history.replaceState({}, document.title, window.location.pathname);
      router.replace(`/admin/${adminId}`);
    }
  }, [router]);

  return (
    <div className="container py-5 d-flex flex-column gap-4 align-items-center">
      <motion.h1 className="fw-bold text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Admin Access — Project Aurora
      </motion.h1>

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

      <button
        onClick={handleGoogleLogin}
        className="btn btn-light w-100 rounded-pill shadow-sm fw-semibold d-flex align-items-center justify-content-center gap-2"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={22} height={22} />
        Continue with Google
      </button>

      <button
        onClick={handleFacebookLogin}
        className="btn btn-primary w-100 rounded-pill shadow-sm fw-semibold d-flex align-items-center justify-content-center gap-2"
        style={{ background: '#1877F2' }}
      >
        <img src="https://www.svgrepo.com/show/452196/facebook-1.svg" alt="Facebook" width={22} height={22} />
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
        ? `/admin/${userId}`
        : `/admin`;
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