// app/page.tsx
// app/page.tsx
'use client';

import { useState } from 'react';

import Nav from '@/components/nav/Nav';
import Footer from '@/components/nav/Footer';
import VideoPlayer, {
  type PlaybackVideo,
} from '@/components/videos/VideoPlayer';

export default function Home() {
  const [activeVideo, setActiveVideo] =
    useState<PlaybackVideo | null>(null);

  return (
    <>
      <Nav />

      <main
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <h1>Video Playback Test</h1>

        <button
          className="btn btn-primary btn-lg"
          onClick={() =>
            setActiveVideo({
              title: 'Project Aurora – Intro',
              subtitle: 'Hard-wired test',
              video_url:
                'https://storage.googleapis.com/project-mirror-assets-aurora/videos/intros/8f11dd89-b031-40ad-a5d1-497ebfb10312.mp4',
              type: 'intro',
            })
          }
        >
          ▶ Play Video
        </button>
      </main>

      {activeVideo && (
        <VideoPlayer
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}

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
