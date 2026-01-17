// app/admin/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import AdminSidebar from '@/components/admin/sidebar/AdminSidebar';
import UploadTab from '@/components/admin/uploads/UploadTab';
import VideosTab from '@/components/admin/videos/VideosTab';


const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const ADMIN_TOKEN_KEY = 'aurora_admin_token';

/* --------------------------------------------------
   Types
-------------------------------------------------- */

type AdminProfile = {
  id: string;
  full_name: string;
  email: string;
};

export type AdminSidebarTab =
  | 'dashboard'
  | 'upload'
  | 'videos';

/* --------------------------------------------------
   Page
-------------------------------------------------- */

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] =
    useState<AdminSidebarTab>('dashboard');

  /* --------------------------------------------------
     Auth bootstrap (mirrors user profile)
  -------------------------------------------------- */
  useEffect(() => {
    const tokenFromURL =
      searchParams.get('token') ||
      searchParams.get('admin_token');

    if (tokenFromURL) {
      localStorage.setItem(ADMIN_TOKEN_KEY, tokenFromURL);
      router.replace(window.location.pathname); // clean URL
      return;
    }

    const token = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (!token) {
      router.replace('/admin/login');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admins/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Unauthorized');
        }

        const data = (await res.json()) as AdminProfile;
        setAdmin(data);
      } catch (err) {
        console.error(err);
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        router.replace('/admin/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams, router]);

  /* --------------------------------------------------
     Logout
  -------------------------------------------------- */
  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    router.push('/admin/login');
  };

  /* --------------------------------------------------
     Layout states
  -------------------------------------------------- */
  if (loading) {
    return (
      <div className="p-4">
        <h4>Loading admin dashboard…</h4>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */
  return (
    <div className="layout min-vh-100">
      <div className="container-fluid">
        <div className="row g-0">
          {/* Sidebar */}
          <div className="col-auto">
            <AdminSidebar
              adminId={admin.id}
              adminName={admin.full_name}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onLogout={handleLogout}
            />
          </div>

          {/* Main Content */}
          <div className="col p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
                className="h-100"
              >
                {/* -----------------------------
                    DASHBOARD
                ----------------------------- */}
                {activeTab === 'dashboard' && (
                  <div
                    className="h-100 d-flex align-items-center justify-content-center"
                    style={{
                      borderRadius: 20,
                      border:
                        '1px dashed var(--aurora-bento-border)',
                      background: 'var(--aurora-bento-bg)',
                    }}
                  >
                    <div style={{ opacity: 0.6 }}>
                      <h4 className="fw-light mb-2">
                        Admin Dashboard
                      </h4>
                      <p className="mb-0">
                        Upload and manage Aurora content
                      </p>
                    </div>
                  </div>
                )}

                {/* -----------------------------
                    UPLOAD
                ----------------------------- */}
                {activeTab === 'upload' && <UploadTab />}

                {/* -----------------------------
                    VIDEOS (next step)
                ----------------------------- */}
                {activeTab === 'videos' && <VideosTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}


{/*
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

*/}

