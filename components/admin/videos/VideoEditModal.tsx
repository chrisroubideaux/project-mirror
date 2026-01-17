// components/admin/videos/VideoEditModal.tsx
'use client';

import { useMemo, useRef, useState } from 'react';
import type { AdminVideo } from './VideosTab';
import AuroraAvatar from '@/components/avatar/AuroraAvatar';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const ADMIN_TOKEN_KEY = 'aurora_admin_token';

/* --------------------------------------------------
   Constants
-------------------------------------------------- */

const allowedTypes = ['intro', 'trailer', 'episode', 'demo', 'test'] as const;
const allowedVis = ['public', 'private', 'unlisted'] as const;

type VideoType = (typeof allowedTypes)[number];
type Visibility = (typeof allowedVis)[number];

/* --------------------------------------------------
   Props
-------------------------------------------------- */

type Props = {
  video: AdminVideo;
  onClose: () => void;
  onSaved: (v: AdminVideo) => void;
};

/* --------------------------------------------------
   Component
-------------------------------------------------- */

export default function VideoEditModal({
  video,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState({
    title: video.title,
    subtitle: video.subtitle ?? '',
    description: video.description ?? '',
    poster_url: video.poster_url,
    video_url: video.video_url,
    duration: video.duration ?? '',
    aspect_ratio: video.aspect_ratio ?? '16:9',
    type: video.type as VideoType,
    visibility: video.visibility as Visibility,
    is_active: video.is_active,
  });

  const [saving, setSaving] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
     Poster Upload
  -------------------------------------------------- */

  const uploadPoster = async (file: File) => {
    if (!headers) {
      alert('Missing admin token');
      return;
    }

    setUploadingPoster(true);

    try {
      // 1️⃣ Ask backend for signed URL
      const signRes = await fetch(`${API_BASE}/api/uploads/sign`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type,
          folder: 'posters',
        }),
      });

      if (!signRes.ok) {
        throw new Error('Failed to sign upload');
      }

      const { signed_url, public_url } = await signRes.json();

      // 2️⃣ Upload file directly to GCS
      const putRes = await fetch(signed_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error('Upload failed');
      }

      // 3️⃣ Update form
      setForm((p) => ({ ...p, poster_url: public_url }));
    } catch (err: any) {
      alert(err?.message || 'Poster upload failed');
    } finally {
      setUploadingPoster(false);
    }
  };

  /* --------------------------------------------------
     Save
  -------------------------------------------------- */

  const save = async () => {
    if (!headers) {
      alert('Missing admin token');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(
        `${API_BASE}/api/videos/admin/${video.id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        throw new Error(`Save failed (${res.status})`);
      }

      const updated = (await res.json()) as AdminVideo;
      onSaved(updated);
    } catch (err: any) {
      alert(err?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(0,0,0,0.55)', zIndex: 2000 }}
      onClick={onClose}
    >
      <div
        className="p-4 w-100"
        style={{
          maxWidth: 900,
          borderRadius: 20,
          background: 'var(--aurora-bento-bg)',
          border: '1px solid var(--aurora-bento-border)',
          backdropFilter: 'blur(18px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex justify-content-between mb-3">
          <h5 className="fw-light mb-0">Edit Video</h5>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
            disabled={saving || uploadingPoster}
          >
            Close
          </button>
        </div>

        {/* Live Preview */}
        <div className="mb-4">
          <AuroraAvatar
            title={form.title || 'Untitled'}
            subtitle={form.subtitle || undefined}
            poster={form.poster_url}
            videoSrc={form.video_url}
            duration={form.duration || undefined}
          />
        </div>

        {/* Poster Upload */}
        <div
          className="mb-4 p-3 text-center"
          style={{
            borderRadius: 14,
            border: '1px dashed var(--aurora-bento-border)',
            cursor: 'pointer',
            opacity: uploadingPoster ? 0.6 : 1,
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) {
              uploadPoster(e.dataTransfer.files[0]);
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) =>
              e.target.files && uploadPoster(e.target.files[0])
            }
          />

          {uploadingPoster
            ? 'Uploading poster…'
            : 'Drag & drop poster image here or click to upload'}
        </div>

        {/* Actions */}
        <div className="d-flex justify-content-end gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={saving || uploadingPoster}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
