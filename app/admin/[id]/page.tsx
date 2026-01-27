// app/admin/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import AdminSidebar from '@/components/admin/sidebar/AdminSidebar';
import UploadTab from '@/components/admin/uploads/UploadTab';
import VideosTab from '@/components/admin/videos/VideosTab';
import StatCards from '@/components/admin/stats/StatCards';
import RecentActivity from '@/components/admin/stats/RecentActivity';

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
     Auth bootstrap
  -------------------------------------------------- */
  useEffect(() => {
    const tokenFromURL =
      searchParams.get('token') ||
      searchParams.get('admin_token');

    if (tokenFromURL) {
      localStorage.setItem(ADMIN_TOKEN_KEY, tokenFromURL);
      router.replace(window.location.pathname);
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

        if (!res.ok) throw new Error('Unauthorized');

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
     Loading / Guard
  -------------------------------------------------- */
  if (loading) {
    return (
      <div className="p-4">
        <h4>Loading admin dashboard…</h4>
      </div>
    );
  }

  if (!admin) return null;

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */
  return (
    <div className="layout min-vh-100">
      <div className="container-fluid">
        <div className="row g-0">
          {/* ---------------------------------
              Sidebar
          --------------------------------- */}
          <div className="col-auto">
            <AdminSidebar
              adminId={admin.id}
              adminName={admin.full_name}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onLogout={handleLogout}
            />
          </div>

          {/* ---------------------------------
              Main Content
          --------------------------------- */}
          <div className="col p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
                className="h-100 d-flex flex-column gap-4"
              >
                {/* =============================
                    DASHBOARD
                ============================= */}
                {activeTab === 'dashboard' && (
                  <>
                    {/* 🔹 STAT CARDS */}
                    <StatCards />

                    {/* 🔹 RECENT ACTIVITY */}
                    <RecentActivity />
                  </>
                )}

                {/* =============================
                    UPLOAD
                ============================= */}
                {activeTab === 'upload' && <UploadTab />}

                {/* =============================
                    VIDEOS
                ============================= */}
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
// app/admin/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import AdminSidebar from '@/components/admin/sidebar/AdminSidebar';
import UploadTab from '@/components/admin/uploads/UploadTab';
import VideosTab from '@/components/admin/videos/VideosTab';
import StatCards from '@/components/admin/stats/StatCards';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const ADMIN_TOKEN_KEY = 'aurora_admin_token';


type AdminProfile = {
  id: string;
  full_name: string;
  email: string;
};

export type AdminSidebarTab =
  | 'dashboard'
  | 'upload'
  | 'videos';



export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] =
    useState<AdminSidebarTab>('dashboard');

  useEffect(() => {
    const tokenFromURL =
      searchParams.get('token') ||
      searchParams.get('admin_token');

    if (tokenFromURL) {
      localStorage.setItem(ADMIN_TOKEN_KEY, tokenFromURL);
      router.replace(window.location.pathname);
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

        if (!res.ok) throw new Error('Unauthorized');

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

  
  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="p-4">
        <h4>Loading admin dashboard…</h4>
      </div>
    );
  }

  if (!admin) return null;

 
  return (
    <div className="layout min-vh-100">
      <div className="container-fluid">
        <div className="row g-0">
         
          <div className="col-auto">
            <AdminSidebar
              adminId={admin.id}
              adminName={admin.full_name}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onLogout={handleLogout}
            />
          </div>

        
          <div className="col p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
                className="h-100 d-flex flex-column gap-4"
              >
                
                {activeTab === 'dashboard' && (
                  <>
                   
                    <StatCards />

                  
                    <div
                      className="flex-grow-1 d-flex align-items-center justify-content-center"
                      style={{
                        borderRadius: 20,
                        border:
                          '1px dashed var(--aurora-bento-border)',
                        background: 'var(--aurora-bento-bg)',
                        opacity: 0.55,
                      }}
                    >
                      <div className="text-center">
                        <h5 className="fw-light mb-2">
                          Analytics Dashboard
                        </h5>
                        <p className="mb-0">
                          Top videos · Trends · Charts coming next
                        </p>
                      </div>
                    </div>
                  </>
                )}

             
                {activeTab === 'upload' && <UploadTab />}

              
                {activeTab === 'videos' && <VideosTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}




*/}

