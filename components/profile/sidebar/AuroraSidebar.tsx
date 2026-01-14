// components/profile/sidebar/AuroraSidebar.tsx

'use client';

import React, { useState } from 'react';
import {
  FaBars,
  FaHome,
  FaHistory,
  FaHeart,
  FaRobot,
  FaCog,
  FaSignOutAlt,
  FaPlayCircle,
} from 'react-icons/fa';
import { motion } from 'framer-motion';

export type AuroraSidebarTab =
  | 'home'
  | 'watching'
  | 'history'
  | 'liked'
  | 'aurora'
  | 'insights'
  | 'settings';

type AuroraSidebarProps = {
  userId: string;
  userName: string;
  activeTab: AuroraSidebarTab;
  onTabChange: (tab: AuroraSidebarTab) => void;
  onLogout?: () => void;
};

export default function AuroraSidebar({
  userId,
  userName,
  activeTab,
  onTabChange,
  onLogout,
}: AuroraSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const links: {
    tab: AuroraSidebarTab;
    label: string;
    icon: React.ReactElement;
    aria: string;
  }[] = [
    { tab: 'home',      label: 'Home',        icon: <FaHome />,        aria: 'Home Feed' },
    { tab: 'watching',  label: 'Watching',    icon: <FaPlayCircle />, aria: 'Currently Watching' },
    { tab: 'history',   label: 'History',     icon: <FaHistory />,    aria: 'Watch History' },
    { tab: 'liked',     label: 'Liked',       icon: <FaHeart />,      aria: 'Liked Videos' },
    { tab: 'aurora',    label: 'Aurora',      icon: <FaRobot />,      aria: 'Aurora Interactions' },
    { tab: 'insights',  label: 'Insights',    icon: <FaRobot />,      aria: 'AI Insights' },
    { tab: 'settings',  label: 'Settings',    icon: <FaCog />,        aria: 'User Settings' },
  ];

  return (
    <motion.div
      className="sidebar shadow d-flex flex-column justify-content-between"
      initial={{ width: 260 }}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        zIndex: 1050,
        overflowX: 'hidden',
        background: 'var(--card-bg)',
        backdropFilter: 'blur(18px)',
        borderRight: '1px solid var(--aurora-bento-border)',
      }}
      data-user-id={userId}
    >
      {/* Header */}
      <div>
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <h6 className="mb-0 fw-light">
            {collapsed ? '🧠' : `Welcome, ${userName.split(' ')[0]}`}
          </h6>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn btn-sm btn-outline-secondary"
            aria-label="Toggle sidebar"
          >
            <FaBars />
          </button>
        </div>

        {/* Tabs */}
        <ul className="nav flex-column mt-3">
          {links.map(({ tab, label, icon, aria }) => {
            const isActive = activeTab === tab;

            return (
              <li className="nav-item" key={tab}>
                <button
                  type="button"
                  onClick={() => onTabChange(tab)}
                  className={`nav-link d-flex align-items-center bg-transparent border-0 w-100 text-start ${
                    isActive ? 'fw-semibold' : ''
                  }`}
                  aria-label={aria}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? label : ''}
                  style={{
                    color: 'var(--foreground)',
                    opacity: isActive ? 1 : 0.75,
                  }}
                >
                  <span className="me-2">{icon}</span>
                  {!collapsed && <span>{label}</span>}
                </button>
              </li>
            );
          })}

          {/* Logout */}
          {onLogout && (
            <li className="nav-item mt-3">
              <button
                onClick={onLogout}
                className="nav-link d-flex align-items-center bg-transparent border-0 w-100"
                title={collapsed ? 'Logout' : ''}
                aria-label="Logout"
                style={{ color: 'var(--foreground)', opacity: 0.7 }}
              >
                <FaSignOutAlt className="me-2" />
                {!collapsed && 'Logout'}
              </button>
            </li>
          )}
        </ul>
      </div>

      {/* Footer */}
      <div className="p-3 border-top small" style={{ opacity: 0.6 }}>
        {!collapsed ? (
          <>
            <div>✨ Project Aurora</div>
            <div style={{ fontSize: '0.75rem' }}>
              Memory-aware AI · {new Date().getFullYear()}
            </div>
          </>
        ) : (
          <div className="text-center">✨</div>
        )}
      </div>
    </motion.div>
  );
}
