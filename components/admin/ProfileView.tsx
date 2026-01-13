// components/admin/ProfileView.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type AdminProfile = {
  id: string;
  full_name: string;
  email: string;
  profile_image_url?: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN_KEY = 'aurora_admin_token';

export default function ProfileView({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);

  // Prevent double execution in React StrictMode
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const run = async () => {
      try {
        // 1) If token is coming in via URL (OAuth redirect), consume it ONCE
        const tokenFromUrl =
          searchParams.get('admin_token') ||
          searchParams.get('token'); // (support older param too)

        if (tokenFromUrl) {
          localStorage.setItem(ADMIN_TOKEN_KEY, tokenFromUrl);

          // Clean the URL to remove token param and stop loops/flicker
          router.replace(`/admin/${id}`);
          return; // stop here; component will re-render on clean URL
        }

        // 2) Otherwise use token from storage
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);

        if (!token) {
          router.replace('/admin/login');
          return;
        }

        // 3) Fetch admin profile (me)
        const res = await fetch(`${API_BASE}/api/admins/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          router.replace('/admin/login');
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          router.replace('/admin/login');
          return;
        }

        setAdmin(data);
      } catch (err) {
        console.error(err);
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        router.replace('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id, router, searchParams]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <h3>Loading admin profile…</h3>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="container py-5 text-center">
        <h3>Admin not found or unauthorized.</h3>
        <button className="btn btn-primary mt-3" onClick={() => router.replace('/admin/login')}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        {admin.profile_image_url ? (
          <img
            src={admin.profile_image_url}
            alt="Profile"
            className="rounded-circle shadow"
            style={{ width: 120, height: 120, objectFit: 'cover' }}
          />
        ) : (
          <div
            className="rounded-circle bg-secondary d-inline-flex justify-content-center align-items-center text-white"
            style={{ width: 120, height: 120 }}
          >
            <span style={{ fontSize: '2rem' }}>
              {admin.full_name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <h2 className="text-center fw-bold">{admin.full_name}</h2>
      <p className="text-center text-muted">{admin.email}</p>

      <hr className="my-4" />

      <div className="mt-5 text-center">
        <button
          className="btn btn-outline-danger rounded-pill px-4"
          onClick={() => {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            router.replace('/admin/login');
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
