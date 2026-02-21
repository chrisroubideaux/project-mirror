// components/admin/aurora/AuroraAnalyticsPanel.tsx
'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

import AuroraUserInfoCard from './AuroraUserInfoCard';
import AuroraPersonalityCard from './AuroraPersonalityCard';
import AuroraTrustEngagementChart from './AuroraTrustEngagementChart';
import AuroraMemoryChart from './AuroraMemoryChart';
import AuroraEmotionChart from './AuroraEmotionChart';

type Overview = {
  total_sessions: number;
  total_users: number;
  avg_engagement: number;
  risk_flag_rate: number;
  emotion_distribution?: Record<string, number>;
  top_themes?: [string, number][];
};

type UserSnapshot = any;

export default function AuroraAnalyticsPanel({
  token,
}: {
  token: string;
}) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [snapshot, setSnapshot] = useState<UserSnapshot | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);

  /* ========================================
     Fetch Global Overview
  ======================================== */
  useEffect(() => {
    if (!token) return;
    fetchOverview();
  }, [token]);

  async function fetchOverview() {
    try {
      const res = await axios.get(
        'http://localhost:5000/api/admins/analytics/aurora/overview',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOverview(res.data.analytics);
    } catch (err) {
      console.error('Failed to load Aurora overview:', err);
    }
  }

  /* ========================================
     Fetch User Snapshot
  ======================================== */
  async function fetchUserSnapshot(userId: string) {
    if (!userId || !token) return;

    try {
      setLoading(true);

      const res = await axios.get(
        `http://localhost:5000/api/admins/analytics/aurora/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSnapshot(res.data.aurora_user_snapshot);
    } catch (err) {
      console.error('Failed to load user snapshot:', err);
    } finally {
      setLoading(false);
    }
  }

  /* ========================================
     UI
  ======================================== */
  return (
    <div className="container-fluid p-4">
      <h4 className="mb-4 fw-light">🧠 Aurora Intelligence Console</h4>

      {/* ================= GLOBAL OVERVIEW ================= */}
      {overview && (
        <div className="card aurora-card mb-4 p-4">
          <h5 className="mb-3">Global Overview</h5>

          <div className="row">
            <div className="col-md-3 mb-3">
              <div className="small text-muted">Total Sessions</div>
              <div className="fs-5">{overview.total_sessions}</div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="small text-muted">Total Users</div>
              <div className="fs-5">{overview.total_users}</div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="small text-muted">Avg Engagement</div>
              <div className="fs-5">{overview.avg_engagement}</div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="small text-muted">Risk Rate</div>
              <div className="fs-5">{overview.risk_flag_rate}</div>
            </div>
          </div>

          {/* Optional: Top Themes */}
          {overview.top_themes && (
            <div className="mt-3">
              <div className="small text-muted mb-1">Top Themes</div>
              <div className="d-flex flex-wrap gap-2">
                {overview.top_themes.slice(0, 5).map(([theme, count]) => (
                  <span
                    key={theme}
                    className="badge bg-secondary-subtle text-secondary-emphasis"
                  >
                    {theme} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= USER LOOKUP ================= */}
      <div className="card aurora-card mb-4 p-4">
        <h5 className="mb-3">User Snapshot</h5>

        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Enter user UUID..."
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          />

          <button
            className="btn btn-primary"
            onClick={() => fetchUserSnapshot(selectedUser)}
          >
            Load
          </button>
        </div>
      </div>

      {/* ================= LOADING ================= */}
      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" />
        </div>
      )}

      {/* ================= USER SNAPSHOT ================= */}
      {snapshot && (
        <>
          <AuroraUserInfoCard snapshot={snapshot} />
          <AuroraPersonalityCard snapshot={snapshot} />
          <AuroraTrustEngagementChart snapshot={snapshot} />
          <AuroraMemoryChart snapshot={snapshot} />
          <AuroraEmotionChart snapshot={snapshot} />
        </>
      )}
    </div>
  );
}
{/*

'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type Overview = {
  total_sessions: number;
  total_users: number;
  avg_engagement: number;
  risk_flag_rate: number;
};

type UserSnapshot = any;

export default function AuroraAnalyticsPanel({
  token,
}: {
  token: string;
}) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [snapshot, setSnapshot] = useState<UserSnapshot | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  async function fetchOverview() {
    const res = await axios.get(
      'http://localhost:5000/api/admins/analytics/aurora/overview',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setOverview(res.data.analytics);
  }

  async function fetchUserSnapshot(userId: string) {
    if (!userId) return;
    setLoading(true);

    const res = await axios.get(
      `http://localhost:5000/api/admins/analytics/aurora/user/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setSnapshot(res.data.aurora_user_snapshot);
    setLoading(false);
  }

  const engagementData =
    snapshot?.engagement_trend?.map((v: number, i: number) => ({
      session: i + 1,
      engagement: v,
    })) || [];

  const emotionData =
    snapshot?.emotion_distribution
      ? Object.entries(snapshot.emotion_distribution).map(
          ([key, value]) => ({
            name: key,
            value,
          })
        )
      : [];

  return (
    <div className="container-fluid p-4">
      <h4 className="mb-4 fw-light">🧠 Aurora Intelligence Console</h4>

     
      {overview && (
        <div className="card mb-4 shadow-sm p-3">
          <h5 className="mb-3">Global Overview</h5>

          <div className="row">
            <div className="col-md-3">
              <div className="small text-muted">Total Sessions</div>
              <div className="fs-5">{overview.total_sessions}</div>
            </div>
            <div className="col-md-3">
              <div className="small text-muted">Total Users</div>
              <div className="fs-5">{overview.total_users}</div>
            </div>
            <div className="col-md-3">
              <div className="small text-muted">Avg Engagement</div>
              <div className="fs-5">{overview.avg_engagement}</div>
            </div>
            <div className="col-md-3">
              <div className="small text-muted">Risk Rate</div>
              <div className="fs-5">{overview.risk_flag_rate}</div>
            </div>
          </div>
        </div>
      )}

    
      <div className="card mb-4 shadow-sm p-3">
        <h5 className="mb-3">User Snapshot</h5>

        <div className="input-group mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Enter user UUID..."
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={() => fetchUserSnapshot(selectedUser)}
          >
            Load
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" />
        </div>
      )}

   
      {snapshot && (
        <>
         
          <div className="card mb-4 shadow-sm p-3">
            <h6 className="mb-3">Relationship</h6>
            <div>Trust: {snapshot.relationship.trust_score}</div>
            <div>Familiarity: {snapshot.relationship.familiarity_score}</div>
            <div>Interactions: {snapshot.relationship.interaction_count}</div>
          </div>

         
          <div className="card mb-4 shadow-sm p-3">
            <h6 className="mb-3">Personality State</h6>
            <div>Tone: {snapshot.personality.tone}</div>
            <div>Verbosity: {snapshot.personality.verbosity}</div>
            <div>Depth: {snapshot.personality.probing_depth}</div>
            <div>Adaptive Score: {snapshot.personality.adaptive_score}</div>
          </div>

          <div className="card mb-4 shadow-sm p-3">
            <h6 className="mb-3">Engagement Trend</h6>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={engagementData}>
                <XAxis dataKey="session" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Line type="monotone" dataKey="engagement" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card mb-4 shadow-sm p-3">
            <h6 className="mb-3">Emotion Distribution</h6>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={emotionData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                >
                  {emotionData.map((_, index) => (
                    <Cell key={index} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

*/}