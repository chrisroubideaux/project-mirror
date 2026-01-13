'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type AdminProfile = {
  id: string;
  full_name: string;
  email: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const ADMIN_TOKEN_KEY = 'aurora_admin_token';

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        // 1️⃣ Read token from URL (OAuth redirect)
        const tokenFromUrl =
          searchParams.get('token') || searchParams.get('admin_token');

        if (tokenFromUrl) {
          localStorage.setItem(ADMIN_TOKEN_KEY, tokenFromUrl);
          router.replace(window.location.pathname); // clean URL
          return;
        }

        // 2️⃣ Read token from storage
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (!token) {
          router.replace('/admin/login');
          return;
        }

        // 3️⃣ Fetch current admin
        const res = await fetch(`${API_BASE}/api/admins/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Unauthorized (${res.status})`);
        }

        const data = (await res.json()) as AdminProfile;
        setAdmin(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load admin profile.');
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        router.replace('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [router, searchParams]);

  // -------------------------
  // UI
  // -------------------------

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <h3>Loading admin profile…</h3>
      </div>
    );
  }

  if (error || !admin) {
    return (
      <div className="container py-5 text-center">
        <h3>Error</h3>
        <p>{error ?? 'Admin not found.'}</p>
        <button
          className="btn btn-primary mt-3"
          onClick={() => router.replace('/admin/login')}
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5 text-center">
      <h1 className="fw-bold">{admin.full_name}</h1>
      <p className="text-muted">{admin.email}</p>

      <button
        className="btn btn-outline-danger mt-4"
        onClick={() => {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          router.replace('/admin');
        }}
      >
        Logout
      </button>
    </div>
  );
}

