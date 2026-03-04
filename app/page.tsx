// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/nav/Nav';
import Footer from '@/components/nav/Footer';
import VideoCard, { type PublicVideo } from '@/components/videos/VideoCard';
import VideoCardSkeleton from '@/components/videos/VideoCardSkeleton';
import AuroraHero from '@/components/hero/AuroraHero';
// Guest Components
import AuroraProductCard from '@/components/guest/AuroraProductCard';
import AuroraTimeline from '@/components/guest/AuroraTimeline';
import AuroraProductMosaic from '@/components/guest/AuroraProductMosaic';
import NeonSeparator from '@/components/about/NeonSeparator';


export default function Home() {
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isLoading = videos.length === 0 && !error;

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/videos');

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: PublicVideo[] = await res.json();
        setVideos(data);
      } catch (err: any) {
        console.error('FETCH ERROR:', err);
        setError(err?.message || 'Failed to load videos');
      }
    };

    fetchVideos();
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      {/* ================= PUBLIC SIDEBAR ================= */}
      <Nav />

      {/* ================= MAIN ================= */}
      <main style={{ width: '100%', minHeight: '100vh' }}>
        
        {/* ================= HERO (FULL WIDTH) ================= */}
        <AuroraHero />

        {/* ================= CONTENT WRAPPER (SHIFTED) ================= */}
        <div
          style={{
            marginLeft: 95,
            transition: 'margin-left 0.3s ease',
          }}
        >
          {/* ================= VIDEOS SECTION ================= */}
          <section className="videos-section">
            <h1 className="videos-title">Trailers</h1>

            {error && (
              <div className="videos-error">
                ❌ Error loading videos: {error}
              </div>
            )}

            <div className="videos-grid">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <VideoCardSkeleton key={i} />
                  ))
                : videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
            </div>
          </section>

          <NeonSeparator />

          {/* ================= PRODUCT CARD ================= */}
          <section style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
            <AuroraProductCard />
          </section>

          <NeonSeparator />

          {/* ================= TIMELINE ================= */}
          <section style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
            <AuroraTimeline />
          </section>

          <NeonSeparator />

          {/* ================= PRODUCT MOSAIC ================= */}
          <section style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
            <AuroraProductMosaic />
          </section>

          <Footer />
        </div>
      </main>
    </div>
  );
}

{/*

// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/nav/Nav';
import Footer from '@/components/nav/Footer';
import VideoCard, { type PublicVideo } from '@/components/videos/VideoCard';
import VideoCardSkeleton from '@/components/videos/VideoCardSkeleton';
import AuroraHero from '@/components/hero/AuroraHero';
// Guest Components
import AuroraProductCard from '@/components/guest/AuroraProductCard';
import AuroraTimeline from '@/components/guest/AuroraTimeline';
import AuroraProductMosaic from '@/components/guest/AuroraProductMosaic';
import NeonSeparator from '@/components/about/NeonSeparator';

export default function Home() {
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isLoading = videos.length === 0 && !error;

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/videos');

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: PublicVideo[] = await res.json();
        setVideos(data);
      } catch (err: any) {
        console.error('FETCH ERROR:', err);
        setError(err.message || 'Failed to load videos');
      }
    };

    fetchVideos();
  }, []);

  return (
    <div style={{ display: 'flex' }}>
 
      <Nav />

      <main style={{ width: '100%', minHeight: '100vh' }}>
        
        <AuroraHero />

        <div
          style={{
            marginLeft: 95, // respect sidebar width
            transition: 'margin-left 0.3s ease',
          }}
        >
          <section
            style={{
              paddingTop: '5rem',
              paddingBottom: '5rem',
              maxWidth: 1400,
              margin: '0 auto',
              paddingLeft: 16,
              paddingRight: 16,
            }}
          >
            <h1 style={{ marginBottom: 24 }}>Videos</h1>

            {error && (
              <div style={{ color: 'red', marginBottom: 20 }}>
                ❌ Error loading videos: {error}
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 24,
              }}
            >
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <VideoCardSkeleton key={i} />
                  ))
                : videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
            </div>
          </section>

          <NeonSeparator />

          <section style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
            <AuroraProductCard />
          </section>

          <NeonSeparator />

          <section style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
            <AuroraTimeline />
          </section>

          <NeonSeparator />

          <section style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
            <AuroraProductMosaic />
          </section>
          <Footer />
        </div>
      </main>
    </div>
  );
}



*/}
