// backend/admin/alerts/AdminAlertsBell.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { FaBell } from 'react-icons/fa';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN_KEY = 'aurora_admin_token';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

type AnalyticsAlert = {
  id: string;
  video_id: string | null;
  alert_type: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  payload?: {
    ai_explanation?: string;
    [key: string]: any;
  };
  created_at: string;
};

const severityColor: Record<string, string> = {
  info: '#00e0ff',
  warning: '#ffb020',
  danger: '#ff6b6b',
};

export default function AdminAlertsBell() {
  const [alerts, setAlerts] = useState<AnalyticsAlert[]>([]);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem(ADMIN_TOKEN_KEY)
      : null;

  /* ---------------------------------------------
     Fetch unread alerts
  --------------------------------------------- */
  const fetchAlerts = async () => {
    if (!token) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/videos/admin/alerts?unread=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) return;

      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      console.error('Alert polling failed:', err);
    }
  };

  /* ---------------------------------------------
     Initial load + polling
  --------------------------------------------- */
  useEffect(() => {
    fetchAlerts(); // initial

    if (!intervalRef.current) {
      intervalRef.current = setInterval(fetchAlerts, POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token]);

  /* ---------------------------------------------
     Acknowledge alert
  --------------------------------------------- */
  const acknowledge = async (id: string) => {
    if (!token) return;

    await fetch(`${API_BASE}/api/videos/admin/alerts/${id}/ack`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell */}
      <button
        className="btn btn-sm btn-outline-secondary position-relative"
        onClick={() => setOpen(o => !o)}
        aria-label="Alerts"
      >
        <FaBell />

        {alerts.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#ff4d4f',
              color: '#fff',
              borderRadius: '50%',
              fontSize: 10,
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {alerts.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '120%',
            width: 320,
            background: 'var(--card-bg)',
            border: '1px solid var(--aurora-bento-border)',
            borderRadius: 12,
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
            zIndex: 2000,
            padding: 8,
          }}
        >
          {alerts.length === 0 ? (
            <div className=" small p-2">
              No unread alerts
            </div>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 6,
                  borderLeft: `4px solid ${severityColor[alert.severity]}`,
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="fw-semibold small">
                  {alert.title}
                </div>

                <div className="small">
                  {alert.message}
                </div>

                {alert.payload?.ai_explanation && (
                  <div
                    className="small mt-1"
                    style={{ fontStyle: 'italic', opacity: 0.8 }}
                  >
                    🤖 {alert.payload.ai_explanation}
                  </div>
                )}

                <button
                  onClick={() => acknowledge(alert.id)}
                  className="btn btn-sm btn-link p-0 mt-1"
                  style={{ fontSize: 12 }}
                >
                  Mark as read
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
