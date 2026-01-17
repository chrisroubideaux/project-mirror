// components/admin/videos/VideosTab.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import VideoEditModal from './VideoEditModal';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const ADMIN_TOKEN_KEY = 'aurora_admin_token';

/* --------------------------------------------------
   Types
-------------------------------------------------- */

export type AdminVideo = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  poster_url: string;
  video_url: string;
  duration?: string | null;
  aspect_ratio?: string | null;
  type: string; // intro | trailer | episode | demo
  visibility: 'public' | 'private' | 'unlisted';
  is_active: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at?: string;
  created_by?: string | null;
};

/* --------------------------------------------------
   Component
-------------------------------------------------- */

export default function VideosTab() {
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<AdminVideo | null>(null);

  /* --------------------------------------------------
     Auth
  -------------------------------------------------- */

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem(ADMIN_TOKEN_KEY)
      : null;

  const headers = useMemo(() => {
    if (!token) return null;
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [token]);

  /* --------------------------------------------------
     Load Videos
  -------------------------------------------------- */

  const loadVideos = async () => {
    if (!headers) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/videos/admin`, {
        headers,
      });

      if (!res.ok) {
        throw new Error(`Failed to load videos (${res.status})`);
      }

      const data = (await res.json()) as AdminVideo[];
      setVideos(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------------------------
     Actions
  -------------------------------------------------- */

  const toggleVisibility = async (video: AdminVideo) => {
    if (!headers) return;

    const nextVisibility =
      video.visibility === 'public' ? 'private' : 'public';

    const res = await fetch(
      `${API_BASE}/api/videos/admin/${video.id}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ visibility: nextVisibility }),
      }
    );

    if (!res.ok) {
      alert('Failed to update visibility');
      return;
    }

    const updated = (await res.json()) as AdminVideo;
    setVideos((prev) =>
      prev.map((v) => (v.id === updated.id ? updated : v))
    );
  };

  const softDelete = async (video: AdminVideo) => {
    if (!headers) return;

    const confirmed = confirm(
      `Soft-delete "${video.title}"?\nThis can be restored later.`
    );
    if (!confirmed) return;

    const res = await fetch(
      `${API_BASE}/api/videos/admin/${video.id}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    if (!res.ok) {
      alert('Failed to soft-delete video');
      return;
    }

    setVideos((prev) =>
      prev.map((v) =>
        v.id === video.id ? { ...v, is_active: false } : v
      )
    );
  };

  /* --------------------------------------------------
     UI States
  -------------------------------------------------- */

  if (loading) {
    return <div className="p-3">Loading videos…</div>;
  }

  if (error) {
    return (
      <div className="p-3">
        <div className="alert alert-danger mb-3">
          {error}
        </div>
        <button
          className="btn btn-outline-light"
          onClick={loadVideos}
        >
          Retry
        </button>
      </div>
    );
  }

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */

  return (
    <div
      className="p-3"
      style={{
        borderRadius: 20,
        background: 'var(--aurora-bento-bg)',
        border: '1px solid var(--aurora-bento-border)',
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="fw-light mb-0">Video Library</h5>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={loadVideos}
        >
          Refresh
        </button>
      </div>

      {/* Empty */}
      {videos.length === 0 ? (
        <div style={{ opacity: 0.7 }}>
          No videos uploaded yet.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Poster</th>
                <th>Title</th>
                <th>Type</th>
                <th>Visibility</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {videos.map((video) => (
                <tr
                  key={video.id}
                  style={{
                    opacity: video.is_active ? 1 : 0.5,
                  }}
                >
                  <td style={{ width: 90 }}>
                    <img
                      src={video.poster_url || '/placeholders/video-poster.jpg'}
                      alt={video.title}
                      style={{ width: 70, height: 42, objectFit: 'cover', borderRadius: 10 }}
                    />
                  </td>

                  <td>
                    <div className="fw-semibold">
                      {video.title}
                    </div>
                    {video.subtitle && (
                      <div
                        style={{
                          fontSize: 12,
                          opacity: 0.7,
                        }}
                      >
                        {video.subtitle}
                      </div>
                    )}
                  </td>

                  <td>{video.type}</td>
                  <td>{video.visibility}</td>
                  <td>
                    {video.is_active ? '✅ Active' : '🗑️ Deleted'}
                  </td>

                  <td className="text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      <button
                        className="btn btn-sm btn-outline-light"
                        onClick={() => setSelected(video)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() =>
                          toggleVisibility(video)
                        }
                      >
                        {video.visibility === 'public'
                          ? 'Unpublish'
                          : 'Publish'}
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => softDelete(video)}
                      >
                        Soft Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {selected && (
        <VideoEditModal
          video={selected}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setVideos((prev) =>
              prev.map((v) =>
                v.id === updated.id ? updated : v
              )
            );
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
