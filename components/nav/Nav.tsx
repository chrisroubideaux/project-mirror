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
      {/* ========================= DESKTOP SIDEBAR ========================= */}
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
        {/* Floating Particles */}
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

        {/* Gradient Edge */}
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

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 30,
            }}
          >
            <AuroraLogo3D />
          </div>

          {/* Links */}
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

        {/* Bottom Theme Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', zIndex: 2 }}>
          <ThemeToggleButton />
        </div>
      </motion.aside>

      {/* ========================= MOBILE TOP BAR ========================= */}
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

      {/* ========================= MOBILE DRAWER ========================= */}
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

{/*

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

  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: 'Home', href: '/', icon: <FaHome /> },
    { label: 'About', href: '/about', icon: <FaInfoCircle /> },
  ];

  const neonColor = isDark ? '#00b7ff' : '#3b82f6';

  return (
    <>
      
      <motion.aside
        className="d-none d-sm-flex"
        animate={{ width: collapsed ? 95 : 240 }}
        transition={{ duration: 0.3 }}
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 2000,
          backdropFilter: 'blur(24px)',
          background: isDark
            ? 'rgba(15,15,25,0.75)'
            : 'rgba(255,255,255,0.75)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1rem 0.6rem',
          overflow: 'hidden',
          boxShadow: isDark
            ? 'inset 0 0 40px rgba(0,0,0,0.6)'
            : 'inset 0 0 25px rgba(0,0,0,0.08)',
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
              justifyContent: collapsed ? 'center' : 'flex-end',
              marginBottom: 20,
            }}
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
              style={{ cursor: 'pointer' }}
              onClick={() => setCollapsed(!collapsed)}
            >
              <FaBars size={18} />
            </motion.div>
          </div>

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
            {[...links, { label: 'Login', href: '/login', icon: <FaSignInAlt /> }].map(
              ({ label, href, icon }) => {
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
                        flexDirection: collapsed ? 'column' : 'row',
                        alignItems: 'center',
                        gap: collapsed ? 6 : 14,
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

                      <span style={{ fontSize: collapsed ? 11 : 14 }}>{label}</span>
                    </motion.div>
                  </Link>
                );
              }
            )}
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 30,
                }}
              >
                <AuroraLogo3D />
                <FaTimes
                  size={20}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setMobileOpen(false)}
                />
              </div>

              <div style={{ marginBottom: 30 }}>
                <ThemeToggleButton />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {links.map(({ label, href, icon }) => {
                  const active = pathname === href;

                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      style={{ textDecoration: 'none' }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: 12,
                          color: isDark ? '#eee' : '#333',
                        }}
                      >
                        {active && (
                          <motion.div
                            layoutId="mobile-active-bar"
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
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                          {icon}
                        </span>
                        <span>{label}</span>
                      </motion.div>
                    </Link>
                  );
                })}

                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  style={{ textDecoration: 'none' }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 12,
                      color: isDark ? '#9aeaff' : '#2563eb',
                    }}
                  >
                    <FaSignInAlt />
                    <span>Login</span>
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}


*/}
