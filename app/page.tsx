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
