// components/nav/Nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '@/store/hooks';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import {
  FaBars,
  FaTimes,
  FaHome,
  FaInfoCircle,
  FaSignInAlt,
} from 'react-icons/fa';
import { useState } from 'react';
import AuroraLogo3D from '@/components/nav/AuroraLogo3D';

export default function Nav() {
  const pathname = usePathname();
  const mode = useAppSelector((state) => state.theme.mode);
  const isDark = mode === 'dark';
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: 'Home', href: '/', icon: <FaHome /> },
    { label: 'About', href: '/about', icon: <FaInfoCircle /> },
  ];

  const neon = '#00e0ff';
  const borderColor = isDark
    ? 'rgba(0, 255, 255, 0.12)'
    : 'rgba(59,130,246,0.15)';
  const textPrimary = isDark ? '#eaf6ff' : '#111';
  const textMuted = isDark ? '#8fbad1' : '#555';

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <motion.aside
        className="d-none d-sm-flex"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          width: 72, // 🔥 thinner rail
          position: 'fixed',
          top: 14,
          bottom: 14,
          left: 14,
          height: 'calc(100vh - 28px)',
          zIndex: 2000,
          backdropFilter: 'blur(22px)',
          background: isDark
            ? 'rgba(10,15,25,0.78)'
            : 'rgba(255,255,255,0.85)',
          border: `1px solid ${borderColor}`,
          borderRadius: 16,
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1rem 0.4rem', // reduced horizontal padding
          overflow: 'hidden',
          boxShadow: isDark
            ? `
              inset 0 0 40px rgba(0,0,0,0.5),
              0 0 18px rgba(0,255,255,0.15),
              0 0 40px rgba(0,255,255,0.08)
            `
            : `
              0 10px 40px rgba(59,130,246,0.08)
            `,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <AuroraLogo3D />
        </div>

        {/* Links */}
        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 26,
            alignItems: 'center',
          }}
        >
          {[...links, { label: 'Login', href: '/login', icon: <FaSignInAlt /> }]
            .map(({ label, href, icon }) => {
              const active = pathname === href;

              return (
                <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 10px',
                      borderRadius: 14,
                      color: active ? neon : textMuted,
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {/* NEON UNDERTONE BAR */}
                    {active && (
                      <motion.div
                        layoutId="aurora-undertone"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          position: 'absolute',
                          left: -5,
                          top: '25%',
                          height: '50%',
                          width: 3,
                          borderRadius: 6,
                          background: neon,
                          boxShadow: `
                            0 0 8px ${neon},
                            0 0 18px ${neon},
                            0 0 30px ${neon}66
                          `,
                        }}
                      />
                    )}

                    <motion.div
                      animate={active ? { scale: 1.15 } : { scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      style={{ fontSize: 18 }} // slightly larger icon
                    >
                      {icon}
                    </motion.div>

                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: 0.5,
                      }}
                    >
                      {label}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
        </nav>

        {/* Theme Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ThemeToggleButton />
        </div>
      </motion.aside>

      {/* ================= MOBILE TOP BAR ================= */}
      <div
        className="d-flex d-sm-none align-items-center justify-content-between px-3"
        style={{
          height: 60,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 3000,
          backdropFilter: 'blur(20px)',
          background: isDark
            ? 'rgba(10,15,25,0.95)'
            : 'rgba(255,255,255,0.95)',
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <AuroraLogo3D />

        <motion.div
          onClick={() => setMobileOpen(!mobileOpen)}
          animate={{ rotate: mobileOpen ? 90 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ cursor: 'pointer', color: textPrimary }}
        >
          {mobileOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </motion.div>
      </div>

      {/* ================= MOBILE DRAWER ================= */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: '#000',
                zIndex: 3500,
              }}
            />

            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                height: '100vh',
                width: 260,
                zIndex: 4000,
                backdropFilter: 'blur(20px)',
                background: isDark
                  ? 'rgba(10,15,25,0.97)'
                  : 'rgba(255,255,255,0.97)',
                padding: '2rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                borderRight: `1px solid ${borderColor}`,
                boxShadow: '0 0 30px rgba(0,255,255,0.1)',
              }}
            >
              <AuroraLogo3D />

              <div style={{ margin: '30px 0' }}>
                <ThemeToggleButton />
              </div>

              {[...links, { label: 'Login', href: '/login', icon: <FaSignInAlt /> }]
                .map(({ label, href, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    style={{ textDecoration: 'none', marginBottom: 22 }}
                  >
                    <motion.div
                      whileHover={{ x: 4 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        fontSize: 15,
                        color: textPrimary,
                      }}
                    >
                      {icon}
                      {label}
                    </motion.div>
                  </Link>
                ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

{/*

// components/nav/Nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '@/store/hooks';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import {
  FaBars,
  FaTimes,
  FaHome,
  FaInfoCircle,
  FaSignInAlt,
} from 'react-icons/fa';
import { useState } from 'react';
import AuroraLogo3D from '@/components/nav/AuroraLogo3D';

export default function Nav() {
  const pathname = usePathname();
  const mode = useAppSelector((state) => state.theme.mode);
  const isDark = mode === 'dark';

  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: 'Home', href: '/', icon: <FaHome /> },
    { label: 'About', href: '/about', icon: <FaInfoCircle /> },
  ];

  const neonColor = isDark ? '#00b7ff' : '#3b82f6';
  const borderColor = 'rgba(255,255,255,0.05)';

  return (
    <>
    
      <motion.aside
        className="d-none d-sm-flex"
        style={{
          width: 95,
          position: 'fixed',
          top: 12,
          bottom: 12,
          left: 12,
          height: 'calc(100vh - 24px)',
          zIndex: 2000,
          backdropFilter: 'blur(24px)',
          background: isDark
            ? 'rgba(15,15,25,0.75)'
            : 'rgba(255,255,255,0.75)',
          border: `1px solid ${borderColor}`,
          borderRadius: 13,
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1rem 0.6rem',
          overflow: 'hidden',
          boxShadow: `
            inset 0 0 40px rgba(0,0,0,0.4),
            0 0 12px ${neonColor}33
          `,
        }}
      >
      
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -50, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 6 + i,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                bottom: `${Math.random() * 100}%`,
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: neonColor,
                boxShadow: `0 0 12px ${neonColor}`,
                opacity: 0.4,
              }}
            />
          ))}
        </div>

        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 4 }}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 2,
            height: '100%',
            background:
              'linear-gradient(to bottom, #00b7ff, #a855f7, #00ffc8)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>
        
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 30,
            }}
          >
            <AuroraLogo3D />
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[...links, { label: 'Login', href: '/login', icon: <FaSignInAlt /> }]
              .map(({ label, href, icon }) => {
                const active = pathname === href;

                return (
                  <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      animate={active ? { boxShadow: `0 0 14px ${neonColor}` } : {}}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 14px',
                        borderRadius: 14,
                        justifyContent: 'center',
                        color:
                          href === '/login'
                            ? isDark
                              ? '#9aeaff'
                              : '#2563eb'
                            : isDark
                            ? '#eee'
                            : '#333',
                        textAlign: 'center',
                      }}
                    >
                      {active && (
                        <motion.div
                          layoutId="active-bar"
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '20%',
                            height: '60%',
                            width: 3,
                            borderRadius: 4,
                            background: neonColor,
                            boxShadow: `0 0 10px ${neonColor}`,
                          }}
                        />
                      )}

                      <motion.div
                        whileHover={{ scale: 1.15 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        {icon}
                      </motion.div>

                      <span style={{ fontSize: 11 }}>{label}</span>
                    </motion.div>
                  </Link>
                );
              })}
          </nav>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', zIndex: 2 }}>
          <ThemeToggleButton />
        </div>
      </motion.aside>

      <div
        className="d-flex d-sm-none align-items-center justify-content-end px-3"
        style={{
          height: 60,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 3000,
          backdropFilter: 'blur(20px)',
          background: isDark
            ? 'rgba(15,15,25,0.92)'
            : 'rgba(255,255,255,0.92)',
        }}
      >
        <motion.div
          onClick={() => setMobileOpen(!mobileOpen)}
          animate={{ rotate: mobileOpen ? 90 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ cursor: 'pointer' }}
        >
          {mobileOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </motion.div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: '#000',
                zIndex: 3500,
              }}
            />

            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                height: '100vh',
                width: 260,
                zIndex: 4000,
                backdropFilter: 'blur(18px)',
                background: isDark
                  ? 'rgba(15,15,25,0.97)'
                  : 'rgba(255,255,255,0.97)',
                padding: '2rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <AuroraLogo3D />

              <div style={{ margin: '30px 0' }}>
                <ThemeToggleButton />
              </div>

              {[...links, { label: 'Login', href: '/login', icon: <FaSignInAlt /> }]
                .map(({ label, href, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    style={{ textDecoration: 'none', marginBottom: 20 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        color: isDark ? '#eee' : '#333',
                      }}
                    >
                      {icon} {label}
                    </motion.div>
                  </Link>
                ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}



*/}
