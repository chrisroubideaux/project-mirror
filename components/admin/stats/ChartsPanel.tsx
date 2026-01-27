// components/admin/stats/ChartsPanel.tsx

'use client';

import { useState } from 'react';
import ViewsBarChart from './ViewsBarChart';
import ViewsLineChart from './ViewsLineChart';
import VideoAnalyticsPanel from './VideoAnalyticsPanel';

type ChartTab = 'daily' | 'weekly';

export default function ChartsPanel() {
  const [activeTab, setActiveTab] = useState<ChartTab>('daily');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  return (
    <div
      className="p-4 rounded"
      style={{
        background: 'var(--aurora-bento-bg)',
        border: '1px solid var(--aurora-bento-border)',
      }}
    >
      {/* =============================
          HEADER + TABS
      ============================= */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="fw-light mb-0">Analytics</h5>

        <div className="btn-group btn-group-sm">
          <button
            className={`btn ${
              activeTab === 'daily'
                ? 'btn-primary'
                : 'btn-outline-secondary'
            }`}
            onClick={() => {
              setActiveTab('daily');
              setSelectedVideo(null);
            }}
          >
            Daily
          </button>

          <button
            className={`btn ${
              activeTab === 'weekly'
                ? 'btn-primary'
                : 'btn-outline-secondary'
            }`}
            onClick={() => {
              setActiveTab('weekly');
              setSelectedVideo(null);
            }}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* =============================
          CHART AREA
      ============================= */}
      <div style={{ height: 360 }}>
        {activeTab === 'daily' && <ViewsLineChart />}

        {activeTab === 'weekly' && (
          <ViewsBarChart onSelectVideo={setSelectedVideo} />
        )}
      </div>

      {/* =============================
          DRILL-DOWN PANEL
      ============================= */}
      {selectedVideo && (
        <VideoAnalyticsPanel
          videoId={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}




{/*
'use client';

import { useState } from 'react';
import ViewsBarChart from './ViewsBarChart';
import ViewsLineChart from './ViewsLineChart';

type ChartTab = 'daily' | 'weekly';

export default function ChartsPanel() {
  const [activeTab, setActiveTab] = useState<ChartTab>('daily');

  return (
    <div
      className="p-4 rounded"
      style={{
        background: 'var(--aurora-bento-bg)',
        border: '1px solid var(--aurora-bento-border)',
      }}
    >
      
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="fw-light mb-0">Analytics</h5>

        <div className="btn-group">
          <button
            className={`btn btn-sm ${
              activeTab === 'daily'
                ? 'btn-primary'
                : 'btn-outline-secondary'
            }`}
            onClick={() => setActiveTab('daily')}
          >
            Daily
          </button>

          <button
            className={`btn btn-sm ${
              activeTab === 'weekly'
                ? 'btn-primary'
                : 'btn-outline-secondary'
            }`}
            onClick={() => setActiveTab('weekly')}
          >
            Weekly
          </button>
        </div>
      </div>

      <div style={{ height: 360 }}>
        {activeTab === 'daily' && <ViewsLineChart />}
        {activeTab === 'weekly' && <ViewsBarChart />}
      </div>
    </div>
  );
}

*/}
