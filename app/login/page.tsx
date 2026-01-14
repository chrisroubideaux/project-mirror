// app/login/page.tsx

'use client';

import Nav from '@/components/nav/Nav';
import AuroraParticles from '@/components/profile/AuroraParticles';
import FaceVerifiedOverlay from '@/components/profile/FaceVerifiedOverlay';

import { useEffect, useRef, useState } from 'react';
import { FaFacebookSquare, FaGoogle } from 'react-icons/fa';
import { FiCamera } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const USER_TOKEN_KEY = 'aurora_user_token';

const MAX_FAILS = 3;
const LOCKOUT_SECONDS = 15;

export default function LoginPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);

  const [failCount, setFailCount] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // --------------------------------------------------
  // OAuth
  // --------------------------------------------------
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google/login`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${API_BASE}/auth/facebook/login`;
  };

  // --------------------------------------------------
  // FACE LOGIN
  // --------------------------------------------------
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
          canvas
            .getContext('2d')!
            .drawImage(videoRef.current!, 0, 0);
          canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95);
        });

      // 🧬 Liveness (two captures)
      const image1 = await capture();
      await new Promise((r) => setTimeout(r, 700));
      const image2 = await capture();

      stream.getTracks().forEach((t) => t.stop());

      const formData = new FormData();
      formData.append('image1', image1);
      formData.append('image2', image2);

      const res = await fetch(`${API_BASE}/api/face/login`, {
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

      localStorage.setItem(USER_TOKEN_KEY, data.token);

      toast.success('Face verified');
      setVerified(true);
      setFailCount(0);

      setTimeout(() => {
        window.location.replace(`/profile/${data.user.id}`);
      }, 1000);
    } catch (err) {
      setFailCount((c) => {
        const next = c + 1;
        if (next >= MAX_FAILS) {
          setLockoutUntil(Date.now() + LOCKOUT_SECONDS * 1000);
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

  // --------------------------------------------------
  // OAuth redirect handler
  // --------------------------------------------------
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');

    if (token) {
      localStorage.setItem(USER_TOKEN_KEY, token);
      window.location.replace('/profile/me');
    }
  }, []);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <>
      <Nav />

      {/* 🌌 Background */}
      <div className="position-relative min-vh-100 d-flex align-items-center justify-content-center">
        <AuroraParticles />

        {/* 🧊 Glass Login Card */}
        <div
          className="position-relative p-4 text-center"
          style={{
            width: 420,
            borderRadius: 20,
            backdropFilter: 'blur(14px)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            color: '#fff',
            zIndex: 2,
          }}
        >
          <h2 className="mb-2 fw-semibold">Login</h2>
          <p className="text-muted mb-4">
            Secure biometric authentication
          </p>

          {/* 🎥 Camera Preview */}
          {loading && (
            <div className="d-flex justify-content-center mb-4">
              <div
                style={{
                  width: 170,
                  height: 170,
                  borderRadius: '50%',
                  padding: 4,
                  background:
                    'conic-gradient(#0d6efd, #6f42c1, #0d6efd)',
                }}
              >
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    background: '#000',
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
                    pathColor: '#6f42c1',
                    textColor: '#fff',
                    trailColor: 'rgba(255,255,255,0.1)',
                  })}
                />
              </div>
            </div>
          )}

          {/* 🔐 Actions */}
          <div className="d-flex flex-column gap-3 mt-3">
            <button
              className="btn w-100"
              style={{
                background:
                  'linear-gradient(135deg, #0d6efd, #6f42c1)',
                color: '#fff',
                borderRadius: 12,
              }}
              onClick={handleFaceLogin}
              disabled={
                loading ||
                (lockoutUntil !== null &&
                  Date.now() < lockoutUntil)
              }
            >
              <FiCamera className="me-2" />
              {loading ? 'Verifying…' : 'Login with Face'}
            </button>

            <button
              className="btn btn-outline-light w-100"
              onClick={handleGoogleLogin}
            >
              <FaGoogle className="me-2" /> Google
            </button>

            <button
              className="btn btn-outline-light w-100"
              onClick={handleFacebookLogin}
            >
              <FaFacebookSquare className="me-2" /> Facebook
            </button>
          </div>

          {error && (
            <p className="text-danger small mt-3">{error}</p>
          )}
        </div>
      </div>

      {/* ✅ Success Overlay */}
      <FaceVerifiedOverlay show={verified} />
    </>
  );
}
