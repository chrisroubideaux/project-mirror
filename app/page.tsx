// app/page.tsx
'use client';

import Nav from '@/components/nav/Nav';
import Footer from '@/components/nav/Footer';

// Hero Elements
import AuroraHero from '@/components/hero/AuroraHero';
import AuroraOrbs from '@/components/hero/AuroraOrbs';
//import AITagline from '@/components/hero/AITagline';

// Guest Presentation Components
import AuroraProductCard from '@/components/guest/AuroraProductCard';
import AuroraBentoGrid from '@/components/guest/AuroraBentoGrid';
import AuroraTimeline from '@/components/guest/AuroraTimeline';

export default function Home() {
  return (
    <>
      <Nav />

      {/* HERO SECTION */}
      <div className="position-relative" style={{ overflow: "hidden" }}>
        <AuroraOrbs />
        <AuroraHero />
      </div>

      {/* MAIN PRODUCT CARD */}
      <AuroraProductCard />

      {/* BENTO FEATURE GRID */}
      <AuroraBentoGrid />

      {/* TIMELINE / STEPS */}
      <AuroraTimeline />

      <Footer />
    </>
  );
}




{/*
'use client';

import Nav from '@/components/nav/Nav';
import Footer from '@/components/nav/Footer';
import AuroraHero from '@/components/hero/AuroraHero';
import AuroraOrbs from '@/components/hero/AuroraOrbs';
import AuroraFeatureGrid from '@/components/hero/AuroraFeatureGrid';
//import AITagline from '@/components/hero/AITagline';

export default function Home() {
  return (
    <>
      <Nav />

    
      <div className="position-relative" style={{ overflow: "hidden" }}>
        <AuroraOrbs />
        <AuroraHero />
        <AuroraFeatureGrid />
      </div>

     
      <Footer />
    </>
  );
*/}
