// components/admin/stats/ViewsAnalytics.tsx

'use client';

import { useState } from 'react';
import ViewsBarChart from './ViewsBarChart';
import PlatformViewsLineChart from './PlatformViewsLineChart';

type Tab = 'bar' | 'line';

export default function ViewsAnalytics() {
  const [tab, setTab] = useState<Tab>('bar');

  return (
    <div
      className="p-4 rounded"
      style={{
        background: 'var(--aurora-bento-bg)',
        border: '1px solid var(--aurora-bento-border)',
      }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-light mb-0">View Analytics</h6>

        {/* Tabs */}
        <div className="btn-group btn-group-sm">
          <button
            className={`btn ${
              tab === 'bar' ? 'btn-primary' : 'btn-outline-secondary'
            }`}
            onClick={() => setTab('bar')}
          >
            Per Video
          </button>

          <button
            className={`btn ${
              tab === 'line' ? 'btn-primary' : 'btn-outline-secondary'
            }`}
            onClick={() => setTab('line')}
          >
            Over Time
          </button>
        </div>
      </div>

      {tab === 'bar' && <ViewsBarChart />}
      {tab === 'line' && <PlatformViewsLineChart />}
    </div>
  );
}
