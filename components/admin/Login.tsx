// app/admin/Login.tsx
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

      {/* Face Login */}
      <button
        onClick={handleFaceLogin}
        className="btn btn-outline-light rounded-pill px-4 py-2"
      >
        Login with Face Recognition
      </button>

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
