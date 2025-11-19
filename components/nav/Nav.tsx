// components/nav/Nav.tsx
// components/nav/Nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMobileMenu, closeMobileMenu } from '@/store/features/uiSlice';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import { FaBars, FaTimes, FaBell } from 'react-icons/fa';
import { useEffect, useState } from 'react';

// ⭐ NEW 3D LOGO
import AuroraLogo3D from '@/components/nav/AuroraLogo3D';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const mobileMenuOpen = useAppSelector((state) => state.ui.mobileMenuOpen);
  const mode = useAppSelector((state) => state.theme.mode);
  const pathname = usePathname();
  const isDark = mode === 'dark';

  const [shrink, setShrink] = useState(false);

  // SCROLL SHRINK
  useEffect(() => {
    const handleScroll = () => setShrink(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' }
  ];

  return (
    <>
      {/* OUTER HOVER BORDER GLOW */}
      <motion.div
        whileHover={{
          boxShadow: isDark
            ? "0 0 28px rgba(0,140,255,0.35)"
            : "0 0 22px rgba(59,130,246,0.30)",
        }}
        transition={{ duration: 0.4 }}
        style={{ width: "100%", position: "sticky", top: 0, zIndex: 2000 }}
      >
        {/* NAVBAR */}
        <motion.nav
          className="navbar navbar-expand-sm px-3 w-100"
          animate={{
            paddingTop: shrink ? "4px" : "14px",
            paddingBottom: shrink ? "4px" : "14px",
            backdropFilter: "blur(16px)",
          }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            borderBottom: isDark
              ? "1px solid rgba(255,255,255,0.12)"
              : "1px solid rgba(0,0,0,0.06)",
            background: isDark
              ? "rgba(15,15,25,0.55)"
              : "rgba(255,255,255,0.55)",
            boxShadow: isDark
              ? "0 0 22px rgba(0,140,255,0.28)"
              : "0 4px 18px rgba(0,0,0,0.10)",
            transition: "all .3s ease",
            position: "relative",
          }}
        >
          <div className="container-fluid d-flex justify-content-between align-items-center">
            
            {/* ⭐ BRAND WITH 3D LOGO */}
            <Link
              href="/"
              onClick={() => dispatch(closeMobileMenu())}
              className="navbar-brand p-0 d-flex align-items-center gap-2"
              style={{ textDecoration: "none" }}
            >
              {/* LOGO */}
              <div
                style={{
                  transform: shrink ? "scale(0.82)" : "scale(1)",
                  transition: "0.35s ease",
                }}
              >
                <AuroraLogo3D />
              </div>

              {/* TEXT */}
              <span
                className="fw-bold"
                style={{
                  fontSize: shrink ? "1.2rem" : "1.45rem",
                  background: isDark
                    ? "linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)"
                    : "linear-gradient(135deg, #2563eb, #7c3aed, #059669)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  transition: "all 0.35s ease",
                }}
              >
               
              </span>
            </Link>

            {/* DESKTOP LINKS */}
            <ul className="navbar-nav d-none d-sm-flex flex-row gap-4 align-items-center mb-0">
              {links.map(({ label, href }) => {
                const active = pathname === href;

                return (
                  <motion.li
                    key={href}
                    className="position-relative"
                    whileHover={{ scale: 1.07 }}
                  >
                    <Link
                      href={href}
                      className="nav-link fw-semibold"
                      style={{ color: isDark ? "#eee" : "#333" }}
                    >
                      {label}

                      {/* Hover Ripple */}
                      <motion.span
                        className="position-absolute top-50 start-50 translate-middle"
                        initial={{ opacity: 0, scale: 0.4 }}
                        whileHover={{ opacity: 0.4, scale: 1.7 }}
                        transition={{ duration: 0.4 }}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          background: isDark
                            ? "radial-gradient(circle, rgba(100,200,255,0.25), transparent 70%)"
                            : "radial-gradient(circle, rgba(120,150,255,0.25), transparent 70%)",
                          pointerEvents: "none",
                          zIndex: -1,
                        }}
                      />

                      {/* Active underline */}
                      {active && (
                        <motion.div
                          layoutId="active-underline"
                          className="position-absolute start-0 bottom-0"
                          style={{
                            height: "2px",
                            width: "100%",
                            background: isDark
                              ? "linear-gradient(90deg, #00b7ff, #a855f7, #00ffc8)"
                              : "linear-gradient(90deg, #3b82f6, #9333ea, #10b981)",
                            borderRadius: "2px",
                          }}
                        />
                      )}
                    </Link>
                  </motion.li>
                );
              })}

              {/* NOTIFICATION */}
              <motion.li
                whileHover={{ scale: 1.15 }}
                className="position-relative"
              >
                <FaBell size={20} style={{ color: isDark ? "#eee" : "#333" }} />

                <span
                  className="position-absolute top-0 end-0"
                  style={{
                    width: "8px",
                    height: "8px",
                    background: isDark ? "#ff4d6d" : "#dc2626",
                    borderRadius: "50%",
                    animation: "pulseDot 1.5s infinite ease-in-out",
                  }}
                />
              </motion.li>

              {/* AVATAR */}
              <motion.li whileHover={{ scale: 1.05 }} className="dropdown">
                <button className="btn border-0 dropdown-toggle p-0">
                  <img
                    src="/default-avatar.png"
                    alt="avatar"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      border: isDark
                        ? "2px solid rgba(0,140,255,0.6)"
                        : "2px solid rgba(0,0,0,0.1)",
                    }}
                  />
                </button>

                <ul
                  className="dropdown-menu dropdown-menu-end shadow"
                  style={{
                    background: isDark
                      ? "rgba(20,20,30,0.9)"
                      : "rgba(255,255,255,0.9)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <li>
                    <Link href="/profile" className="dropdown-item">
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings" className="dropdown-item">
                      Settings
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <Link href="/logout" className="dropdown-item">
                      Logout
                    </Link>
                  </li>
                </ul>
              </motion.li>

              {/* THEME TOGGLE */}
              <li>
                <ThemeToggleButton className="btn-sm" />
              </li>
            </ul>

            {/* MOBILE MENU BTN */}
            <button
              className="navbar-toggler border-0 d-sm-none"
              onClick={() => dispatch(toggleMobileMenu())}
            >
              {mobileMenuOpen ? (
                <FaTimes size={22} className="text-light" />
              ) : (
                <FaBars size={22} className="text-light" />
              )}
            </button>
          </div>

          {/* LOADING BAR */}
          <motion.div
            layoutId="loading-bar"
            className="position-absolute bottom-0 start-0"
            style={{
              width: "100%",
              height: "3px",
              background: isDark
                ? "linear-gradient(90deg, #00b7ff, #a855f7, #00ffc8)"
                : "linear-gradient(90deg, #2563eb, #9333ea, #10b981)",
            }}
          />
        </motion.nav>
      </motion.div>

      {/* ANIM STYLES */}
      <style>
        {`
        @keyframes pulseDot {
          0% { transform: scale(1); opacity: .7; }
          50% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(1); opacity: .7; }
        }
      `}
      </style>
    </>
  );
}



{/*

// components/nav/Nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMobileMenu, closeMobileMenu } from '@/store/features/uiSlice';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import { FaBars, FaTimes, FaBell } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import AuroraLogo3D from '@/components/nav/AuroraLogo3D';




export default function Navbar() {
  const dispatch = useAppDispatch();
  const mobileMenuOpen = useAppSelector((state) => state.ui.mobileMenuOpen);
  const mode = useAppSelector((state) => state.theme.mode);
  const pathname = usePathname();
  const isDark = mode === 'dark';

  const [shrink, setShrink] = useState(false);

  // SCROLL SHRINK
  useEffect(() => {
    const handleScroll = () => setShrink(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' }
  ];

  return (
    <>
    
      <motion.div
        whileHover={{ boxShadow: isDark 
          ? "0 0 28px rgba(0,140,255,0.35)" 
          : "0 0 22px rgba(59,130,246,0.30)" }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', position: 'sticky', top: 0, zIndex: 2000 }}
      >

       
        <motion.nav
          className="navbar navbar-expand-sm px-3 w-100"
          animate={{
            paddingTop: shrink ? "4px" : "14px",
            paddingBottom: shrink ? "4px" : "14px",
            backdropFilter: "blur(16px)"
          }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            borderBottom: isDark
              ? '1px solid rgba(255,255,255,0.12)'
              : '1px solid rgba(0,0,0,0.06)',
            background: isDark
              ? 'rgba(15,15,25,0.55)'
              : 'rgba(255,255,255,0.55)',
            boxShadow: isDark
              ? '0 0 22px rgba(0,140,255,0.28)'
              : '0 4px 18px rgba(0,0,0,0.10)',
            transition: 'all .3s ease',
            position: 'relative'
          }}
        >
          <div className="container-fluid d-flex justify-content-between align-items-center">
            
          
            <Link
  href="/"
  onClick={() => dispatch(closeMobileMenu())}
  className="navbar-brand fw-bold p-0"
  style={{
    fontSize: shrink ? "1.25rem" : "1.45rem",
    background: isDark
      ? 'linear-gradient(135deg, #00b7ff, #a855f7, #00ffc8)'
      : 'linear-gradient(135deg, #2563eb, #7c3aed, #059669)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }}
>
  Project-Mirror
</Link>


            
            <ul className="navbar-nav d-none d-sm-flex flex-row gap-4 align-items-center mb-0">

              {links.map(({ label, href }) => {
                const active = pathname === href;

                return (
                  <motion.li
                    key={href}
                    className="position-relative"
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={href}
                      className="nav-link fw-semibold"
                      style={{ color: isDark ? '#eee' : '#333' }}
                    >
                      {label}

                     
                      <motion.span
                        className="position-absolute top-50 start-50 translate-middle"
                        initial={{ opacity: 0, scale: 0.4 }}
                        whileHover={{ opacity: 0.4, scale: 1.7 }}
                        transition={{ duration: 0.4 }}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          background: isDark
                            ? 'radial-gradient(circle, rgba(100,200,255,0.25), transparent 70%)'
                            : 'radial-gradient(circle, rgba(120,150,255,0.25), transparent 70%)',
                          pointerEvents: 'none',
                          zIndex: -1
                        }}
                      />

                 
                      {active && (
                        <motion.div
                          layoutId="active-underline"
                          className="position-absolute start-0 bottom-0"
                          style={{
                            height: '2px',
                            width: '100%',
                            background: isDark
                              ? 'linear-gradient(90deg, #00b7ff, #a855f7, #00ffc8)'
                              : 'linear-gradient(90deg, #3b82f6, #9333ea, #10b981)',
                            borderRadius: '2px'
                          }}
                        />
                      )}
                    </Link>
                  </motion.li>
                );
              })}

             
              <motion.li 
                whileHover={{ scale: 1.15 }} 
                className="position-relative"
              >
                <FaBell size={20} style={{ color: isDark ? '#eee' : '#333' }} />

              
                <span
                  className="position-absolute top-0 end-0"
                  style={{
                    width: '8px',
                    height: '8px',
                    background: isDark ? '#ff4d6d' : '#dc2626',
                    borderRadius: '50%',
                    animation: 'pulseDot 1.5s infinite ease-in-out'
                  }}
                />
              </motion.li>

             
              <motion.li whileHover={{ scale: 1.05 }} className="dropdown">
                <button className="btn border-0 dropdown-toggle p-0">
                  <img
                    src="/default-avatar.png"
                    alt="avatar"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: isDark
                        ? '2px solid rgba(0,140,255,0.6)'
                        : '2px solid rgba(0,0,0,0.1)'
                    }}
                  />
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end shadow"
                  style={{
                    background: isDark
                      ? 'rgba(20,20,30,0.9)'
                      : 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <li><Link href="/profile" className="dropdown-item">Profile</Link></li>
                  <li><Link href="/settings" className="dropdown-item">Settings</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link href="/logout" className="dropdown-item">Logout</Link></li>
                </ul>
              </motion.li>

            
              <li><ThemeToggleButton className="btn-sm" /></li>

            </ul>

       
            <button
              className="navbar-toggler border-0 d-sm-none"
              onClick={() => dispatch(toggleMobileMenu())}
            >
              {mobileMenuOpen ? (
                <FaTimes size={22} className="text-light" />
              ) : (
                <FaBars size={22} className="text-light" />
              )}
            </button>
          </div>

       
          <motion.div
            layoutId="loading-bar"
            className="position-absolute bottom-0 start-0"
            style={{
              width: '100%',
              height: '3px',
              background: isDark
                ? 'linear-gradient(90deg, #00b7ff, #a855f7, #00ffc8)'
                : 'linear-gradient(90deg, #2563eb, #9333ea, #10b981)'
            }}
          />
        </motion.nav>
      </motion.div>

      
      <style>
        {`
        @keyframes pulseDot {
          0% { transform: scale(1); opacity: .7; }
          50% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(1); opacity: .7; }
        }
      `}
      </style>
    </>
  );
}





*/}
