// app/page.tsx
'use client';

import Nav from '@/components/nav/Nav';
import Footer from '@/components/nav/Footer';

// Hero Elements
import AuroraHero from '@/components/hero/AuroraHero';
import AuroraOrbs from '@/components/hero/AuroraOrbs';

// Guest Presentation Components
import AuroraProductCard from '@/components/guest/AuroraProductCard';
//import AuroraBentoGrid from '@/components/guest/AuroraBentoGrid';
import AuroraTimeline from '@/components/guest/AuroraTimeline';
import AuroraProductMosaic from '@/components/guest/AuroraProductMosaic';

import NeonSeparator from '@/components/about/NeonSeparator';

export default function Home() {
  return (
    <>
      <Nav />
      <AuroraHero />
      <AuroraOrbs />

      {/* MAIN PRODUCT CARD */}
      <section style={{ paddingTop: "5rem", paddingBottom: "5rem" }}>
        <AuroraProductCard />
      </section>

      <NeonSeparator />

      {/* TIMELINE / STEPS */}
      <section style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
        <AuroraTimeline />
      </section>

      <NeonSeparator />

      {/* PRODUCT MOSAIC */}
      <section style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
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

// Guest Presentation Components
import AuroraProductCard from '@/components/guest/AuroraProductCard';
import AuroraBentoGrid from '@/components/guest/AuroraBentoGrid';
import AuroraTimeline from '@/components/guest/AuroraTimeline';
import AuroraProductMosaic from '@/components/guest/AuroraProductMosaic';

export default function Home() {
  return (
    <>
      <Nav />

    
      <section
        className="position-relative"
        style={{
          overflow: "hidden",
          paddingTop: "6rem",
          paddingBottom: "6rem",
        }}
      >
        <AuroraOrbs />
        <AuroraHero />
      </section>

   
      <section style={{ paddingTop: "5rem", paddingBottom: "5rem" }}>
        <AuroraProductCard />
      </section>

    
      <section style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
        <AuroraBentoGrid />
      </section>

    
      <section style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
        <AuroraTimeline />
      </section>

    
      <section style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
        <AuroraProductMosaic />
      </section>

     
      <Footer />
    </>
  );
}



*/}
