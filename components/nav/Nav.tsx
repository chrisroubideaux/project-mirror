// components/nav/Nav.tsx
// components/nav/Nav.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMobileMenu, closeMobileMenu } from '@/store/features/uiSlice';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import { FaBars, FaTimes } from 'react-icons/fa';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const mobileMenuOpen = useAppSelector((state) => state.ui.mobileMenuOpen);

  const links = ['Home', 'About', 'Contact'];

  return (
    <>
      <div className="mt-2">
        <motion.nav
          className="shadow-lg navbar navbar-expand-sm mx-auto py-2 px-3 position-relative"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            background: 'transparent',
            zIndex: 10,
          }}
        >
          <div className="container-fluid d-flex justify-content-between align-items-center">
            {/* Logo */}
            <Link
              href="/"
              className="navbar-brand d-flex align-items-center p-0"
              onClick={() => dispatch(closeMobileMenu())}
              style={{
                height: '40px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <motion.div
                animate={{ y: [0, -3, 0, 3, 0] }}
                transition={{
                  duration: 5,
                  ease: 'easeInOut',
                  repeat: Infinity,
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Project-mirror
              </motion.div>
            </Link>

            {/* 🔹 Desktop Nav Links */}
            <ul className="navbar-nav d-none d-sm-flex flex-row align-items-center gap-4 mb-0">
              {links.map((text) => (
                <motion.li
                  key={text}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={text === 'Home' ? '/' : `/${text.toLowerCase()}`}
                    className="nav-link fw-semibold"
                  >
                    {text}
                  </Link>
                </motion.li>
              ))}

              {/* 🔹 Login Button */}
              <motion.li
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/login"
                  className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold"
                >
                  Login
                </Link>
              </motion.li>

              <li className="nav-item">
                <ThemeToggleButton placement="inline" className="btn-sm" />
              </li>
            </ul>

            {/* 🔸 Mobile Toggle */}
            <button
              className="navbar-toggler border-0 d-sm-none"
              type="button"
              onClick={() => dispatch(toggleMobileMenu())}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? (
                <FaTimes className="social-icon" size={20} />
              ) : (
                <FaBars className="social-icon" size={20} />
              )}
            </button>
          </div>

          {/* 🔻 Animated Mobile Dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                className="d-sm-none w-100 text-center py-4 mt-2 rounded bg-light"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ul className="navbar-nav flex-column gap-3">
                  {links.map((text) => (
                    <motion.li
                      key={text}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href={text === 'Home' ? '/' : `/${text.toLowerCase()}`}
                        className="nav-link fw-semibold"
                        onClick={() => dispatch(closeMobileMenu())}
                      >
                        {text}
                      </Link>
                    </motion.li>
                  ))}

                  {/* 🔹 Mobile Login Link */}
                  <motion.li
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/login"
                      className="btn btn-outline-primary rounded-pill px-3 fw-semibold"
                      onClick={() => dispatch(closeMobileMenu())}
                    >
                      Login
                    </Link>
                  </motion.li>

                  <li className="mt-3">
                    <ThemeToggleButton placement="inline" className="btn-sm" />
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      </div>
    </>
  );
}


{/*
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMobileMenu, closeMobileMenu } from '@/store/features/uiSlice';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import { FaBars, FaTimes } from 'react-icons/fa';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const mobileMenuOpen = useAppSelector((state) => state.ui.mobileMenuOpen);

  const links = ['Home', 'About', 'Contact'];

  return (
    <>
    <div className="mt-2">
    <motion.nav
      className="shadow-lg navbar navbar-expand-sm mx-auto py-2 px-3 position-relative"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        background: 'transparent',
        zIndex: 10,
      }}
    >
      <div className="container-fluid d-flex justify-content-between align-items-center">
       
        <Link
          href="/"
          className="navbar-brand d-flex align-items-center p-0"
          onClick={() => dispatch(closeMobileMenu())}
          style={{
            height: '40px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <motion.div
            animate={{ y: [0, -3, 0, 3, 0] }}
            transition={{
              duration: 5,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Project-mirror
          </motion.div>
        </Link>

      
        <ul className="navbar-nav d-none d-sm-flex flex-row align-items-center gap-4 mb-0">
          {links.map((text) => (
            <motion.li
              key={text}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={text === 'Home' ? '/' : `/${text.toLowerCase()}`}
                className="nav-link fw-semibold"
              >
                {text}
              </Link>
            </motion.li>
          ))}
          <li className="nav-item">
            <ThemeToggleButton placement="inline" className="btn-sm" />
          </li>
        </ul>

      
        <button
          className="navbar-toggler border-0 d-sm-none"
          type="button"
          onClick={() => dispatch(toggleMobileMenu())}
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <FaTimes className='social-icon' size={20} /> : <FaBars className='social-icon' size={20} />}
        </button>
      </div>

     
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="d-sm-none w-100 text-center py-4 mt-2 rounded bg-light"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="navbar-nav flex-column gap-3">
              {links.map((text) => (
                <motion.li
                  key={text}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={text === 'Home' ? '/' : `/${text.toLowerCase()}`}
                    className="nav-link fw-semibold"
                    onClick={() => dispatch(closeMobileMenu())}
                  >
                    {text}
                  </Link>
                </motion.li>
              ))}
              <li className="mt-3">
                <ThemeToggleButton placement="inline" className="btn-sm" />
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
    </div>
    </>
  );
}

*/}
