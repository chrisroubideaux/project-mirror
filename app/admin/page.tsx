// page/admin/page.tsx

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
