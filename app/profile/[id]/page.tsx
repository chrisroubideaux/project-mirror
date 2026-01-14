// app/profile/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const USER_TOKEN_KEY = 'aurora_user_token';

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        /**
         * --------------------------------------------------
         * 1️⃣ OAuth fallback (rare but supported)
         * --------------------------------------------------
         * Normally OAuth redirects to /login which stores
         * the token and redirects here.
         * This exists only as a safety net.
         */
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
          localStorage.setItem(USER_TOKEN_KEY, tokenFromUrl);
          router.replace(window.location.pathname); // clean URL
          return;
        }

        /**
         * --------------------------------------------------
         * 2️⃣ Read token from storage
         * --------------------------------------------------
         */
        const token = localStorage.getItem(USER_TOKEN_KEY);
        if (!token) {
          router.replace('/login');
          return;
        }

        /**
         * --------------------------------------------------
         * 3️⃣ Fetch authenticated user
         * --------------------------------------------------
         */
        const res = await fetch(`${API_BASE}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Unauthorized (${res.status})`);
        }

        const data = (await res.json()) as UserProfile;
        setUser(data);
      } catch (err) {
        console.error('[PROFILE LOAD ERROR]', err);
        setError('Failed to load user profile.');
        localStorage.removeItem(USER_TOKEN_KEY);
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router, searchParams]);

  // --------------------------------------------------
  // UI STATES
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <h3>Loading your profile…</h3>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container py-5 text-center">
        <h3>Error</h3>
        <p>{error ?? 'User not found.'}</p>
        <button
          className="btn btn-primary mt-3"
          onClick={() => router.replace('/login')}
        >
          Back to Login
        </button>
      </div>
    );
  }

  // --------------------------------------------------
  // AUTHENTICATED VIEW
  // --------------------------------------------------

  return (
    <div className="container py-5 text-center">
      <h1 className="fw-bold">{user.full_name}</h1>
      <p className="text-muted">{user.email}</p>

      <button
        className="btn btn-outline-danger mt-4"
        onClick={() => {
          localStorage.removeItem(USER_TOKEN_KEY);
          router.replace('/login');
        }}
      >
        Logout
      </button>
    </div>
  );
}

