// app/profile/[id]/page.tsx
'use client';

import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import AuroraSidebar, {
  type AuroraSidebarTab,
} from '@/components/profile/sidebar/AuroraSidebar';

import HomeFeed from '@/components/profile/home/HomeFeed';
import ReelsFeed from '@/components/profile/reels/ReelsFeed';
import WatchingFeed from '@/components/profile/watching/WatchingFeed';
import HistoryFeed from '@/components/profile/history/HistoryFeed';
import LikedFeed from '@/components/profile/liked/LikedFeed';

/* FULLSCREEN AURORA */
import UserAurora from '@/components/profile/aurora/UserAurora';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:5000';

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

  /* ===============================
     AUTH + USER BOOTSTRAP
  =============================== */

  useEffect(() => {

    const tokenFromURL = searchParams.get('token');

    if (tokenFromURL) {
      localStorage.setItem(TOKEN_KEY, tokenFromURL);
    }

    const token =
      tokenFromURL || localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setError('No auth token');
      setLoading(false);
      return;
    }

    (async () => {

      try {

        const res = await fetch(`${API_BASE}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Auth failed (${res.status})`);
        }

        const data = (await res.json()) as PageUser;

        if (!data?.id) {
          throw new Error('Invalid user payload');
        }

        setUser(data);

        /* Normalize /profile/me */

        if (
          routeId === 'me' ||
          (routeId && routeId !== data.id)
        ) {
          router.replace(`/profile/${data.id}`);
        }

      } catch (err) {

        console.error('❌ Profile bootstrap failed:', err);
        setError('Authentication failed');

      } finally {

        setLoading(false);

      }

    })();

  }, [searchParams, routeId, router]);

  /* ===============================
     LOGOUT
  =============================== */

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    router.push('/login');
  };

  /* ===============================
     LOADING / ERROR
  =============================== */

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <h3>Loading profile…</h3>
      </div>
    );
  }

  if (error || !user) {
    router.push('/login');
    return null;
  }

  /* ===============================
     LAYOUT
  =============================== */

  return (
    <>
      {/* ===============================
         FULLSCREEN AURORA
      =============================== */}

      {activeTab === 'aurora' && (
        <UserAurora
          userName={user.full_name}
          onClose={() => setActiveTab('home')}
        />
      )}

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

        {/* SIDEBAR */}

        <AuroraSidebar
          userId={user.id}
          userName={user.full_name}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={handleLogout}
        />

        {/* MAIN CONTENT */}

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

              {activeTab === 'home' && (
                <HomeFeed userId={user.id} />
              )}

              {activeTab === 'watching' && (
                <WatchingFeed userId={user.id} />
              )}

              {activeTab === 'history' && (
                <HistoryFeed userId={user.id} />
              )}

              {activeTab === 'reels' && (
                <ReelsFeed userId={user.id} />
              )}

              {activeTab === 'liked' && (
                <LikedFeed userId={user.id} />
              )}

            </motion.div>

          </AnimatePresence>

        </div>

      </div>
    </>
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

import HomeFeed from '@/components/profile/home/HomeFeed';
import ReelsFeed from '@/components/profile/reels/ReelsFeed';
import WatchingFeed from '@/components/profile/watching/WatchingFeed';
import HistoryFeed from '@/components/profile/history/HistoryFeed';
import LikedFeed from '@/components/profile/liked/LikedFeed';


const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:5000';

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

  useEffect(() => {
    const tokenFromURL = searchParams.get('token');

    if (tokenFromURL) {
      localStorage.setItem(TOKEN_KEY, tokenFromURL);
    }

    const token =
      tokenFromURL || localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setError('No auth token');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Auth failed (${res.status})`);
        }

        const data = (await res.json()) as PageUser;

        if (!data?.id) {
          throw new Error('Invalid user payload');
        }

        setUser(data);

        // ✅ Normalize /profile/me or mismatched IDs
        if (
          routeId === 'me' ||
          (routeId && routeId !== data.id)
        ) {
          router.replace(`/profile/${data.id}`);
        }
      } catch (err) {
        console.error('❌ Profile bootstrap failed:', err);
        setError('Authentication failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams, routeId, router]);

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    router.push('/login');
  };

  
  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <h3>Loading profile…</h3>
      </div>
    );
  }

  if (error || !user) {
    router.push('/login');
    return null;
  }

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
    
      <AuroraSidebar
        userId={user.id}
        userName={user.full_name}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

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
            

            {activeTab === 'home' && (
              <HomeFeed userId={user.id} />
            )}

            {activeTab === 'watching' && (
              <WatchingFeed userId={user.id} />
            )}

            {activeTab === 'history' && (
              <HistoryFeed userId={user.id} />
            )}

            {activeTab === 'reels' && (
              <ReelsFeed userId={user.id} />
            )}
            {activeTab === 'liked' && (
              <LikedFeed userId={user.id} />
            )}
            
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}




*/}

