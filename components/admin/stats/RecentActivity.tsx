// components/admin/stats/RecentActivity.tsx
'use client';

import { useEffect, useState } from 'react';
import { FaEye, FaUpload, FaVideo } from 'react-icons/fa';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const ADMIN_TOKEN_KEY = 'aurora_admin_token';

/* --------------------------------------------------
   Types
-------------------------------------------------- */

type ActivityVideo = {
  id: string;
  title: string;
  type: string;
  view_count: number;
  updated_at: string;
};

/* --------------------------------------------------
   Component
-------------------------------------------------- */

export default function RecentActivity() {
  const [items, setItems] = useState<ActivityVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/videos/admin/recent`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error('Failed to load activity');

        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error('RecentActivity error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* --------------------------------------------------
     Helpers
  -------------------------------------------------- */

  const timeAgo = (iso: string) => {
    const diff =
      Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */

  return (
    <div
      className="p-4 rounded-4"
      style={{
        background: 'var(--aurora-bento-bg)',
        border: '1px solid var(--aurora-bento-border)',
      }}
    >
      <h5 className="fw-light mb-3">
        Recent Activity
      </h5>

      {loading && (
        <div style={{ opacity: 0.6 }}>
          Loading activity…
        </div>
      )}

      {!loading && items.length === 0 && (
        <div style={{ opacity: 0.6 }}>
          No recent activity
        </div>
      )}

      <ul className="list-unstyled mb-0">
        {items.map((v) => (
          <li
            key={v.id}
            className="d-flex align-items-center gap-3 py-2"
            style={{
              borderBottom:
                '1px dashed var(--aurora-bento-border)',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {v.view_count > 0 ? (
                <FaEye />
              ) : (
                <FaUpload />
              )}
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {v.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.6,
                }}
              >
                {v.view_count > 0
                  ? `Viewed (${v.view_count} total)`
                  : 'Uploaded'}{' '}
                · {v.type}
              </div>
            </div>

            {/* Time */}
            <div
              style={{
                fontSize: 11,
                opacity: 0.5,
                whiteSpace: 'nowrap',
              }}
            >
              {timeAgo(v.updated_at)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
