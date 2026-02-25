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

  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: 'Home', href: '/', icon: <FaHome /> },
    { label: 'About', href: '/about', icon: <FaInfoCircle /> },
  ];

  const neonGlow = isDark
    ? '0 0 12px rgba(0,140,255,0.6)'
    : '0 0 10px rgba(59,130,246,0.6)';

  return (
    <>
      {/* =========================
         DESKTOP SIDEBAR
      ========================== */}
      <motion.aside
        className="d-none d-sm-flex"
        animate={{ width: collapsed ? 90 : 220 }}
        transition={{ duration: 0.3 }}
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 2000,
          backdropFilter: 'blur(18px)',
          background: isDark
            ? 'rgba(15,15,25,0.75)'
            : 'rgba(255,255,255,0.75)',
          borderRight: isDark
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(0,0,0,0.08)',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1rem 0.5rem',
        }}
      >
        <div>
          {/* Collapse Button */}
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
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {links.map(({ label, href, icon }) => {
              const active = pathname === href;

              return (
                <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                  <motion.div
                    whileHover={{
                      scale: 1.05,
                      boxShadow: neonGlow,
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: collapsed ? 'column' : 'row',
                      alignItems: 'center',
                      gap: collapsed ? 6 : 14,
                      padding: '10px 12px',
                      borderRadius: 14,
                      justifyContent: 'center',
                      background: active
                        ? isDark
                          ? 'rgba(0,140,255,0.25)'
                          : 'rgba(59,130,246,0.15)'
                        : 'transparent',
                      color: isDark ? '#eee' : '#333',
                      transition: 'all .25s ease',
                      textAlign: 'center',
                    }}
                  >
                    {icon}
                    <span
                      style={{
                        fontSize: collapsed ? 11 : 14,
                        opacity: collapsed ? 0.8 : 1,
                      }}
                    >
                      {label}
                    </span>
                  </motion.div>
                </Link>
              );
            })}

            {/* Login */}
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{
                  scale: 1.05,
                  boxShadow: neonGlow,
                }}
                style={{
                  display: 'flex',
                  flexDirection: collapsed ? 'column' : 'row',
                  alignItems: 'center',
                  gap: collapsed ? 6 : 14,
                  padding: '10px 12px',
                  borderRadius: 14,
                  justifyContent: 'center',
                  color: isDark ? '#9aeaff' : '#2563eb',
                  textAlign: 'center',
                }}
              >
                <FaSignInAlt />
                <span style={{ fontSize: collapsed ? 11 : 14 }}>
                  Login
                </span>
              </motion.div>
            </Link>
          </nav>
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ThemeToggleButton />
        </div>
      </motion.aside>

      {/* =========================
         MOBILE TOP BAR
         [                          ☰ ]
      ========================== */}
      <div
        className="d-flex d-sm-none align-items-center justify-content-end px-3"
        style={{
          height: 60,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 3000,
          backdropFilter: 'blur(18px)',
          background: isDark
            ? 'rgba(15,15,25,0.92)'
            : 'rgba(255,255,255,0.92)',
          borderBottom: isDark
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <motion.div
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ cursor: 'pointer' }}
          animate={{ rotate: mobileOpen ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {mobileOpen ? (
            <FaTimes size={22} />
          ) : (
            <FaBars size={22} />
          )}
        </motion.div>
      </div>

      {/* =========================
         MOBILE DRAWER
      ========================== */}
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
                {links.map(({ label, href, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    style={{ textDecoration: 'none' }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05, boxShadow: neonGlow }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        color: isDark ? '#eee' : '#333',
                        padding: '10px 12px',
                        borderRadius: 12,
                      }}
                    >
                      {icon} {label}
                    </motion.div>
                  </Link>
                ))}

                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  style={{ textDecoration: 'none' }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05, boxShadow: neonGlow }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      color: isDark ? '#9aeaff' : '#2563eb',
                      padding: '10px 12px',
                      borderRadius: 12,
                    }}
                  >
                    <FaSignInAlt /> Login
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

  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: 'Home', href: '/', icon: <FaHome /> },
    { label: 'About', href: '/about', icon: <FaInfoCircle /> },
  ];

  return (
    <>
     
      <motion.aside
        className="d-none d-sm-flex"
        animate={{ width: collapsed ? 80 : 220 }}
        transition={{ duration: 0.3 }}
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 2000,
          backdropFilter: 'blur(18px)',
          background: isDark
            ? 'rgba(15,15,25,0.75)'
            : 'rgba(255,255,255,0.75)',
          borderRight: isDark
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(0,0,0,0.08)',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1rem 0.5rem',
        }}
      >
       
        <div>
         
          <div
            style={{
              display: 'flex',
              justifyContent: collapsed ? 'center' : 'flex-end',
              marginBottom: 20,
            }}
          >
            <FaBars
              size={18}
              style={{ cursor: 'pointer' }}
              onClick={() => setCollapsed(!collapsed)}
            />
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

        
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {links.map(({ label, href, icon }) => {
              const active = pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  style={{ textDecoration: 'none' }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '10px 12px',
                      borderRadius: 12,
                      justifyContent: collapsed
                        ? 'center'
                        : 'flex-start',
                      background: active
                        ? isDark
                          ? 'rgba(0,140,255,0.25)'
                          : 'rgba(59,130,246,0.15)'
                        : 'transparent',
                      color: isDark ? '#eee' : '#333',
                      transition: 'all .2s ease',
                    }}
                  >
                    {icon}
                    {!collapsed && <span>{label}</span>}
                  </motion.div>
                </Link>
              );
            })}

            <Link href="/login" style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '10px 12px',
                  borderRadius: 12,
                  justifyContent: collapsed
                    ? 'center'
                    : 'flex-start',
                  color: isDark ? '#9aeaff' : '#2563eb',
                }}
              >
                <FaSignInAlt />
                {!collapsed && <span>Login</span>}
              </motion.div>
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ThemeToggleButton />
        </div>
      </motion.aside>

      <div
        className="d-flex d-sm-none justify-content-between align-items-center px-3"
        style={{
          height: 60,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 3000,
          backdropFilter: 'blur(18px)',
          background: isDark
            ? 'rgba(15,15,25,0.85)'
            : 'rgba(255,255,255,0.85)',
          borderBottom: isDark
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <FaBars
          size={20}
          style={{ cursor: 'pointer' }}
          onClick={() => setMobileOpen(true)}
        />

        <AuroraLogo3D />

        <ThemeToggleButton />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: '#000',
                zIndex: 3500,
              }}
            />

           
            <motion.div
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                height: '100vh',
                width: 220,
                zIndex: 4000,
                backdropFilter: 'blur(18px)',
                background: isDark
                  ? 'rgba(15,15,25,0.95)'
                  : 'rgba(255,255,255,0.95)',
                padding: '2rem 1rem',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
             
              <div
                style={{
                  marginBottom: 30,
                  cursor: 'pointer',
                }}
                onClick={() => setMobileOpen(false)}
              >
                <FaTimes size={20} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {links.map(({ label, href, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        color: isDark ? '#eee' : '#333',
                      }}
                    >
                      {icon} {label}
                    </div>
                  </Link>
                ))}

                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      color: isDark ? '#9aeaff' : '#2563eb',
                    }}
                  >
                    <FaSignInAlt /> Login
                  </div>
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
