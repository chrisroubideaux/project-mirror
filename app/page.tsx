// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/nav/Nav';
import Footer from '@/components/nav/Footer';
import VideoCard, {
  type PublicVideo,
} from '@/components/videos/VideoCard';

// Hero Elements
import AuroraHero from '@/components/hero/AuroraHero';
import AuroraOrbs from '@/components/hero/AuroraOrbs';

// Demo Avatar Card
// Guest Presentation Components
import AuroraProductCard from '@/components/guest/AuroraProductCard';
// import AuroraBentoGrid from '@/components/guest/AuroraBentoGrid';
import AuroraTimeline from '@/components/guest/AuroraTimeline';
import AuroraProductMosaic from '@/components/guest/AuroraProductMosaic';

import NeonSeparator from '@/components/about/NeonSeparator';

export default function Home() {
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/videos') // 🔥 IMPORTANT: explicit backend
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('VIDEOS FROM API:', data); // 🔥 MUST APPEAR
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
      <AuroraHero />
        

      <section style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
        <h1>Videos</h1>

        {/* 🔴 SHOW ERRORS */}
        {error && (
          <div style={{ color: 'red', marginBottom: 20 }}>
            ❌ Error loading videos: {error}
          </div>
        )}

        {/* 🔴 SHOW EMPTY STATE */}
        {videos.length === 0 && !error && (
          <div style={{ color: 'orange', marginBottom: 20 }}>
            ⚠️ No videos returned from API
          </div>
        )}

        {/* ✅ ACTUAL VIDEO CARDS */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {videos.map((video) => (
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
