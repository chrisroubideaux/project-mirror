// page/admin/page.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { FaFacebookSquare, FaGoogle } from 'react-icons/fa';
import { FiCamera } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';

import FaceVerifiedOverlay from '@/components/admin/FaceVerifiedOverlay';

const API_BASE = 'http://localhost:5000';

const MAX_FAILS = 3;
const LOCKOUT_SECONDS = 15;

export default function AdminLogin() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);

  const [failCount, setFailCount] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // -------------------------------
  // OAuth
  // -------------------------------
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/admin/google/login`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${API_BASE}/auth/admin/facebook/login`;
  };

  // -------------------------------
  // FACE LOGIN
  // -------------------------------
  const handleFaceLogin = async () => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      toast.error('Face login temporarily locked');
      return;
    }

    let stream: MediaStream | null = null;

    try {
      setLoading(true);
      setError(null);
      setConfidence(null);

      toast.info('Scanning face… hold still', { autoClose: 1200 });

      // 🎥 Start camera
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const capture = (): Promise<Blob> =>
        new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current!.videoWidth;
          canvas.height = videoRef.current!.videoHeight;
          canvas.getContext('2d')!.drawImage(videoRef.current!, 0, 0);
          canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95);
        });

      const image1 = await capture();
      await new Promise((r) => setTimeout(r, 700));
      const image2 = await capture();

      stream.getTracks().forEach((t) => t.stop());

      const formData = new FormData();
      formData.append('image1', image1);
      formData.append('image2', image2);

      const res = await fetch(`${API_BASE}/api/admin/face/login`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.match) {
        throw new Error(data.reason || 'Face verification failed');
      }

      // 🧠 Confidence
      const score = Math.round((data.score ?? 0.9) * 100);
      setConfidence(score);

      localStorage.setItem('aurora_admin_token', data.token);

      toast.success('Face verified');
      setVerified(true);
      setFailCount(0);

      setTimeout(() => {
        window.location.replace(`/admin/${data.user.id}`);
      }, 1000);
    } catch (err) {
      console.error(err);

      setFailCount((c) => {
        const next = c + 1;
        if (next >= MAX_FAILS) {
          const until = Date.now() + LOCKOUT_SECONDS * 1000;
          setLockoutUntil(until);

          let remaining = LOCKOUT_SECONDS;
          const interval = setInterval(() => {
            toast.warn(`Face login locked (${remaining}s)`, { autoClose: 900 });
            remaining--;
            if (remaining <= 0) clearInterval(interval);
          }, 1000);
        }
        return next;
      });

      toast.error('Face login failed');
      setError(err instanceof Error ? err.message : 'Face login failed');
    } finally {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setLoading(false);
    }
  };

  // -------------------------------
  // OAuth redirect handler
  // -------------------------------
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    const adminId = url.searchParams.get('admin_id');

    if (token && adminId) {
      localStorage.setItem('aurora_admin_token', token);
      window.location.replace(`/admin/${adminId}`);
    }
  }, []);

  return (
    <>
      <div className="container py-5" style={{ maxWidth: 400 }}>
        <h2 className="text-center mb-4">Admin Login</h2>

        {/* 🎥 Camera Preview */}
        {loading && (
          <div className="d-flex justify-content-center mb-3">
            <div style={{ width: 160, height: 160, position: 'relative' }}>
              <video
                ref={videoRef}
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #0d6efd',
                }}
              />
            </div>
          </div>
        )}

        {/* 🧠 Confidence Ring */}
        {confidence !== null && (
          <div className="d-flex justify-content-center mb-3">
            <div style={{ width: 120 }}>
              <CircularProgressbar
                value={confidence}
                text={`${confidence}%`}
                styles={buildStyles({
                  pathColor: '#198754',
                  textColor: '#198754',
                })}
              />
            </div>
          </div>
        )}

        <div className="d-flex flex-column gap-3">
          <button className="btn btn-outline-danger" onClick={handleGoogleLogin}>
            <FaGoogle /> Continue with Google
          </button>

          <button className="btn btn-outline-primary" onClick={handleFacebookLogin}>
            <FaFacebookSquare /> Continue with Facebook
          </button>

          <button
            className="btn btn-outline-secondary"
            onClick={handleFaceLogin}
            disabled={loading || (lockoutUntil !== null && Date.now() < lockoutUntil)}
          >
            <FiCamera /> {loading ? 'Verifying…' : 'Login with Face'}
          </button>

          {error && <p className="text-danger text-center">{error}</p>}
        </div>
      </div>

      <FaceVerifiedOverlay show={verified} />
    </>
  );
}

{/*
'use client';

import { useEffect, useState } from 'react';
import { FaFacebookSquare, FaGoogle } from 'react-icons/fa';
import { FiCamera } from 'react-icons/fi';

const API_BASE = 'http://localhost:5000';

export default function AdminLogin() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // -------------------------------
  // OAuth
  // -------------------------------
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/admin/google/login`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${API_BASE}/auth/admin/facebook/login`;
  };

  const handleFaceLogin = async () => {
  try {
    setLoading(true);
    setError(null);

    // 1️⃣ Start camera
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();

    const capture = (): Promise<Blob> =>
      new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')!.drawImage(video, 0, 0);
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95);
      });

    // 2️⃣ Capture TWO frames (liveness)
    const image1 = await capture();
    await new Promise((r) => setTimeout(r, 700));
    const image2 = await capture();

    // 3️⃣ Stop camera
    stream.getTracks().forEach((t) => t.stop());

    // 4️⃣ Send to backend
    const formData = new FormData();
    formData.append('image1', image1);
    formData.append('image2', image2);

    const res = await fetch('http://localhost:5000/api/admin/face/login', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok || !data.match) {
      throw new Error(data.reason || 'Face login failed');
    }

    // ✅ 5️⃣ SAVE TOKEN
    localStorage.setItem('aurora_admin_token', data.token);

    // ✅ 6️⃣ REDIRECT TO ADMIN ID PAGE
    window.location.replace(`/admin/${data.user.id}`);
  } catch (err) {
    console.error(err);
    setError(err instanceof Error ? err.message : 'Face login failed');
  } finally {
    setLoading(false);
  }
};


  // -------------------------------
  // OAuth redirect handler
  // -------------------------------
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    const adminId = url.searchParams.get('admin_id');

    if (token && adminId) {
      localStorage.setItem('adminToken', token);
      window.location.replace(`/admin/${adminId}`);
    }
  }, []);

  return (
    <div className="container py-5" style={{ maxWidth: 400 }}>
      <h2 className="text-center mb-4">Admin Login</h2>

      <div className="d-flex flex-column gap-3">
        <button
          className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2"
          onClick={handleGoogleLogin}
        >
          <FaGoogle /> Continue with Google
        </button>

        <button
          className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2"
          onClick={handleFacebookLogin}
        >
          <FaFacebookSquare /> Continue with Facebook
        </button>

        <button
          className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
          onClick={handleFaceLogin}
          disabled={loading}
        >
          <FiCamera />
          {loading ? 'Verifying face…' : 'Login with Face'}
        </button>

        {error && (
          <p className="text-danger text-center mt-3">{error}</p>
        )}
      </div>
    </div>
  );
}
*/}
