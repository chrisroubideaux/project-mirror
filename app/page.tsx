'use client';

import Nav from '@/components/nav/Nav';
import Footer from '@/components/nav/Footer';
import AuroraHero from '@/components/hero/AuroraHero';

export default function Home() {
  return (
    <>
      {/* NAVBAR */}
      <Nav />

      {/* HERO SECTION */}
      <AuroraHero />

      {/* CONTENT (Optional) */}
      <div className="container text-center py-5">
        <h2 className="fw-bold mb-3">
          Welcome to Project AURORA
        </h2>
        <p className="text-secondary">
          Emotion AI, holographic UI, and next-generation empathy analysis.
        </p>
      </div>

      {/* FOOTER */}
      <Footer />
    </>
  );
}



{/*
'use client';
import Footer from '@/components/nav/Footer';
import Nav from '@/components/nav/Nav';


export default function Home() {
  

  return (
    <>
    <div className="layout-100vh ">
    <Nav />
    <div className="container text-center py-5">
      <h1 className='text-dark'>Welcome to Project AURORA</h1>
     </div>
   
    </div>
      <Footer />
    </>
  );
}
*/}
