// app/page.tsx
'use client';

import { useEffect, useState } from 'react';

import Nav from '@/components/nav/Nav';
import Footer from '@/components/nav/Footer';

import VideoCard, {
  type PublicVideo,
} from '@/components/videos/VideoCard';
import VideoCardSkeleton from '@/components/videos/VideoCardSkeleton';

// Hero Elements
import AuroraHero from '@/components/hero/AuroraHero';
import AuroraOrbs from '@/components/hero/AuroraOrbs';

// Guest Presentation Components
import AuroraProductCard from '@/components/guest/AuroraProductCard';
import AuroraTimeline from '@/components/guest/AuroraTimeline';
import AuroraProductMosaic from '@/components/guest/AuroraProductMosaic';

import NeonSeparator from '@/components/about/NeonSeparator';

export default function Home() {
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isLoading = videos.length === 0 && !error;

  useEffect(() => {
    fetch('http://localhost:5000/api/videos')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('VIDEOS FROM API:', data);
        setVideos(data);
      })
      .catch((err) => {
        console.error('FETCH ERROR:', err);
        setError(err.message);
      });
  }, []);

  return (
    <>
      <Nav />

      {/* HERO */}
      <AuroraHero />
      <AuroraOrbs />

      {/* VIDEOS SECTION */}
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

        {/* ERROR STATE */}
        {error && (
          <div style={{ color: 'red', marginBottom: 20 }}>
            ❌ Error loading videos: {error}
          </div>
        )}

        {/* VIDEO GRID */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(280px, 1fr))',
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

      {/* PRODUCT CARD */}
      <section style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
        <AuroraProductCard />
      </section>

      <NeonSeparator />

      {/* TIMELINE */}
      <section style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
        <AuroraTimeline />
      </section>

      <NeonSeparator />

      {/* PRODUCT MOSAIC */}
      <section style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
        <AuroraProductMosaic />
      </section>

      <Footer />
    </>
  );
}


{/*

// app/page.tsx
'use client';

import Nav from '@/components/nav/Nav';
import Footer from '@/components/nav/Footer';

// Hero Elements
import AuroraHero from '@/components/hero/AuroraHero';
import AuroraOrbs from '@/components/hero/AuroraOrbs';

// Demo Avatar Card
import AuroraAvatar from '@/components/avatar/AuroraAvatar';

// Guest Presentation Components
import AuroraProductCard from '@/components/guest/AuroraProductCard';
// import AuroraBentoGrid from '@/components/guest/AuroraBentoGrid';
import AuroraTimeline from '@/components/guest/AuroraTimeline';
import AuroraProductMosaic from '@/components/guest/AuroraProductMosaic';

import NeonSeparator from '@/components/about/NeonSeparator';

export default function Home() {
  return (
    <>
      <Nav />

      <AuroraHero />

      <section style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
        <AuroraAvatar
          poster="/demos/aurora-intro.jpg"
          videoSrc="/videos/aurora-intro.mp4"
          title="Aurora"
          subtitle="Intro Transmission"
        />
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
    </>
  );
}




*/}
