// app/profile/[id]/page.tsx
'use client';

import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import AuroraSidebar, {
  type AuroraSidebarTab,
} from '@/components/profile/sidebar/AuroraSidebar';

import HomeFeed from '@/components/profile/home/HomeFeed';

const TOKEN_KEY = 'aurora_user_token';

type PageUser = {
  id: string;
  full_name: string;
  email: string;
};

export default function AuroraProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  const routeId = params?.id as string | undefined;

  const [user, setUser] = useState<PageUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] =
    useState<AuroraSidebarTab>('home');

  /* ---------------------------------------------
     Auth + User bootstrap
  --------------------------------------------- */
  useEffect(() => {
    const tokenFromURL = searchParams.get('token');

    if (tokenFromURL) {
      localStorage.setItem(TOKEN_KEY, tokenFromURL);
    }

    const token =
      tokenFromURL || localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setError('No token found');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000'}/api/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }

        const data = (await res.json()) as PageUser;

        if (!data?.id) {
          throw new Error('Invalid user payload');
        }

        setUser(data);

        // ✅ Handle /profile/me or mismatched IDs
        if (routeId === 'me' || (routeId && routeId !== data.id)) {
          router.replace(`/profile/${data.id}`);
          return;
        }
      } catch (err) {
        console.error('❌ Failed to load user:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams, router, routeId]);

  /* ---------------------------------------------
     Logout
  --------------------------------------------- */
  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    router.push('/login');
  };

  /* ---------------------------------------------
     Loading / Error
  --------------------------------------------- */
  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h3>Loading…</h3>
      </div>
    );
  }

  if (error || !user) {
    router.push('/login');
    return null;
  }

  /* ---------------------------------------------
     Layout
  --------------------------------------------- */
  return (
    <div
      className="aurora-layout"
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--app-bg)',
      }}
    >
      {/* Sidebar */}
      <AuroraSidebar
        userId={user.id}
        userName={user.full_name}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div
        className="aurora-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 24,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            style={{ minHeight: '100%' }}
          >
            {/* =========================
               Tab Routing
            ========================== */}

            {activeTab === 'home' && (
              <HomeFeed userId={user.id} />
            )}

            {activeTab !== 'home' && (
              <div
                style={{
                  height: '100%',
                  borderRadius: 20,
                  border: '1px dashed var(--aurora-bento-border)',
                  background: 'var(--aurora-bento-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ opacity: 0.6, textAlign: 'center' }}>
                  <h4 className="fw-light mb-2">
                    {activeTab.toUpperCase()}
                  </h4>
                  <p className="mb-0">
                    Content will render here
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}


{/*

// app/profile/[id]/page.tsx
'use client';

import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import AuroraSidebar, {
  type AuroraSidebarTab,
} from '@/components/profile/sidebar/AuroraSidebar';

const TOKEN_KEY = 'aurora_user_token';

type PageUser = {
  id: string;
  full_name: string;
  email: string;
};

export default function AuroraProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  const routeId = params?.id as string | undefined;

  const [user, setUser] = useState<PageUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] =
    useState<AuroraSidebarTab>('home');

  // --------------------------------------------------
  // Auth + User bootstrap (RESTORED)
  // --------------------------------------------------
  useEffect(() => {
    const tokenFromURL = searchParams.get('token');

    if (tokenFromURL) {
      localStorage.setItem(TOKEN_KEY, tokenFromURL);
    }

    const token =
      tokenFromURL || localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setError('No token found');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000'}/api/users/me`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }

        const data = (await res.json()) as PageUser;

        if (!data?.id) {
          throw new Error('Invalid user payload');
        }

        setUser(data);

        // ✅ Handle /profile/me OR wrong id
        if (routeId === 'me' || (routeId && routeId !== data.id)) {
          router.replace(`/profile/${data.id}`);
          return;
        }
      } catch (err) {
        console.error('❌ Failed to load user:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams, router, routeId]);

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------
  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    router.push('/login');
  };

  // --------------------------------------------------
  // Layout States
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="p-4">
        <h3>Loading…</h3>
      </div>
    );
  }

  if (error || !user) {
    router.push('/login');
    return null;
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="layout min-vh-100">
      <div className="container-fluid">
        <div className="row g-0">
          <div className="col-auto">
            <AuroraSidebar
              userId={user.id}
              userName={user.full_name}
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
                className="h-100"
              >
              
                <div
                  className="d-flex align-items-center justify-content-center h-100"
                  style={{
                    borderRadius: 20,
                    border: '1px dashed var(--aurora-bento-border)',
                    background: 'var(--aurora-bento-bg)',
                  }}
                >
                  <div style={{ opacity: 0.6 }}>
                    <h4 className="fw-light mb-2">
                      {activeTab.toUpperCase()}
                    </h4>
                    <p className="mb-0">
                      Content will render here
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}




*/}

