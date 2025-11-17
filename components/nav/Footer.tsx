// components/nav/Footer.tsx
// components/nav/Footer.tsx
"use client";

import { FaFacebookF, FaInstagram, FaYoutube, FaTiktok } from "react-icons/fa";

export default function Footer() {
  return (
    <footer
      className="py-4 mt-auto"
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        transition: "background 0.4s ease, color 0.4s ease",
      }}
    >
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
        {/* Copyright */}
        <p
          className="mb-2 mb-md-0 small"
          style={{ opacity: 0.8 }}
        >
          © {new Date().getFullYear()} Mirror. All rights reserved.
        </p>

        {/* Social Media */}
        <div className="d-flex gap-3">
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--foreground)",
              transition: "color 0.3s ease",
            }}
          >
            <FaFacebookF className="social-icon" size={20} />
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--foreground)",
              transition: "color 0.3s ease",
            }}
          >
            <FaInstagram className="social-icon" size={20} />
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--foreground)",
              transition: "color 0.3s ease",
            }}
          >
            <FaYoutube className="social-icon" size={20} />
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--foreground)",
              transition: "color 0.3s ease",
            }}
          >
            <FaTiktok className="social-icon" size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}
