// components/admin/alerts/AlertsTab.tsx
'use client';

import { useEffect, useState } from 'react';
import { FaFilter } from 'react-icons/fa';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN_KEY = 'aurora_admin_token';

type Severity = 'info' | 'warning' | 'danger';

type AnalyticsAlert = {
  id: string;
  video_id: string | null;
  alert_type: string;
  severity: Severity;
  title: string;
  message: string;
  payload?: {
    ai_explanation?: string;
    [key: string]: any;
  };
  created_at: string;
  acknowledged_at?: string | null;
};

const severityColor: Record<Severity, string> = {
  info: '#00e0ff',
  warning: '#ffb020',
  danger: '#ff6b6b',
};

export default function AlertsTab() {
  const [alerts, setAlerts] = useState<AnalyticsAlert[]>([]);
  const [severity, setSeverity] = useState<'all' | Severity>('all');

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem(ADMIN_TOKEN_KEY)
      : null;

  /* ---------------------------------------------
     Fetch alerts
  --------------------------------------------- */
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/videos/admin/alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setAlerts)
      .catch(console.error);
  }, [token]);

  /* ---------------------------------------------
     Ack alert
  --------------------------------------------- */
  const acknowledge = async (id: string) => {
    if (!token) return;

    await fetch(`${API_BASE}/api/videos/admin/alerts/${id}/ack`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    setAlerts(prev =>
      prev.map(a =>
        a.id === id ? { ...a, acknowledged_at: new Date().toISOString() } : a
      )
    );
  };

  const filtered = alerts.filter(
    a => severity === 'all' || a.severity === severity
  );

  return (
    <div className="d-flex flex-column gap-4">
      {/* ============================= */}
      {/* Header */}
      {/* ============================= */}
      <div className="d-flex align-items-center justify-content-between">
        <h4 className="fw-light mb-0">Alerts</h4>

        <div className="d-flex align-items-center gap-2">
          <FaFilter />
          <select
            className="form-select form-select-sm"
            value={severity}
            onChange={e => setSeverity(e.target.value as any)}
            style={{
              background: 'var(--card-bg)',
              color: 'var(--foreground)',
              borderColor: 'var(--aurora-bento-border)',
            }}
          >
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="danger">Critical</option>
          </select>
        </div>
      </div>

      {/* ============================= */}
      {/* Alerts List */}
      {/* ============================= */}
      {filtered.length === 0 ? (
        <div className="">No alerts</div>
      ) : (
        filtered.map(alert => (
          <div
            key={alert.id}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--aurora-bento-border)',
              borderRadius: 14,
              padding: 14,
              opacity: alert.acknowledged_at ? 0.6 : 1,
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div
                  className="fw-semibold"
                  style={{ color: severityColor[alert.severity] }}
                >
                  {alert.title}
                </div>

                <div className="small text-muted">
                  {new Date(alert.created_at).toLocaleString()}
                </div>
              </div>

              {!alert.acknowledged_at && (
                <button
                  onClick={() => acknowledge(alert.id)}
                  className="btn btn-sm btn-outline-secondary"
                >
                  Mark as read
                </button>
              )}
            </div>

            <div className="mt-2 small">{alert.message}</div>

            {alert.payload?.ai_explanation && (
              <div
                className="mt-2 small"
                style={{ fontStyle: 'italic', opacity: 0.8 }}
              >
                🤖 {alert.payload.ai_explanation}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

