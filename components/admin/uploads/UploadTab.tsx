// components/admin/uploads/UploadTab.tsx

'use client';

import { useMemo, useState } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN_KEY = 'aurora_admin_token';

type UploadState =
  | 'idle'
  | 'signing_video'
  | 'uploading_video'
  | 'signing_poster'
  | 'uploading_poster'
  | 'registering'
  | 'done'
  | 'error';

type Signed = {
  signed_url: string;
  public_url: string;
  object_name: string;
};

async function getSignedUrl(params: {
  token: string;
  filename: string;
  content_type: string;
  folder: string;
}): Promise<Signed> {
  const res = await fetch(`${API_BASE}/api/uploads/sign`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: params.filename,
      content_type: params.content_type,
      folder: params.folder,
    }),
  });

  if (!res.ok) throw new Error(`Sign failed (${res.status})`);
  return res.json();
}

function putUploadWithProgress(opts: {
  signedUrl: string;
  file: File;
  onProgress: (pct: number) => void;
}) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', opts.signedUrl);
    xhr.setRequestHeader('Content-Type', opts.file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Upload error'));
    xhr.send(opts.file);
  });
}

export default function UploadTab() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'intro' | 'trailer' | 'episode'>('intro');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  const [state, setState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);

  const [videoProgress, setVideoProgress] = useState(0);
  const [posterProgress, setPosterProgress] = useState(0);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem(ADMIN_TOKEN_KEY)
      : null;

  const canUpload =
    !!token &&
    !!videoFile &&
    !!posterFile &&
    state === 'idle' &&
    (title.trim().length > 0 || !!videoFile?.name);

  const folders = useMemo(() => {
    // Keep it organized in your Aurora bucket
    return {
      video: `videos/${type}s`,     // videos/intros | videos/trailers | videos/episodes
      poster: `posters/${type}s`,   // posters/intros | posters/trailers | posters/episodes
    };
  }, [type]);

  const reset = () => {
    setState('idle');
    setError(null);
    setVideoProgress(0);
    setPosterProgress(0);
  };

  const setDefaultsFromVideo = (f: File) => {
    if (!title.trim()) {
      setTitle(f.name.replace(/\.[^/.]+$/, ''));
    }
  };

  /* --------------------------------------------
     Drag & Drop helpers (no libraries)
  -------------------------------------------- */

  const [dragOver, setDragOver] = useState(false);

  const onDrop = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // prefer mp4 for video, image for poster
    const arr = Array.from(files);

    const vid = arr.find((f) => f.type === 'video/mp4') || null;
    const img =
      arr.find((f) => f.type === 'image/jpeg') ||
      arr.find((f) => f.type === 'image/png') ||
      null;

    if (vid) {
      setVideoFile(vid);
      setDefaultsFromVideo(vid);
    }
    if (img) setPosterFile(img);

    if (!vid && !img) {
      setError('Drop an MP4 video and a JPG/PNG poster.');
    } else {
      setError(null);
    }
  };

  /* --------------------------------------------
     Upload flow: sign -> put -> register
  -------------------------------------------- */

  const startUpload = async () => {
    if (!token || !videoFile || !posterFile) return;

    try {
      reset();

      // 1) Sign + upload video
      setState('signing_video');
      const signedVideo = await getSignedUrl({
        token,
        filename: videoFile.name,
        content_type: videoFile.type,
        folder: folders.video,
      });

      setState('uploading_video');
      await putUploadWithProgress({
        signedUrl: signedVideo.signed_url,
        file: videoFile,
        onProgress: setVideoProgress,
      });

      // 2) Sign + upload poster
      setState('signing_poster');
      const signedPoster = await getSignedUrl({
        token,
        filename: posterFile.name,
        content_type: posterFile.type,
        folder: folders.poster,
      });

      setState('uploading_poster');
      await putUploadWithProgress({
        signedUrl: signedPoster.signed_url,
        file: posterFile,
        onProgress: setPosterProgress,
      });

      // 3) Register in DB
      setState('registering');
      const res = await fetch(`${API_BASE}/api/videos/admin`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim() || videoFile.name.replace(/\.[^/.]+$/, ''),
          type,
          visibility,
          video_url: signedVideo.public_url,
          poster_url: signedPoster.public_url,
        }),
      });

      if (!res.ok) {
        throw new Error(`Register failed (${res.status})`);
      }

      setState('done');
      setVideoProgress(100);
      setPosterProgress(100);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Upload failed');
      setState('error');
    }
  };

  return (
    <div className="h-100 d-flex flex-column gap-3">
      <div
        className="p-4"
        style={{
          borderRadius: 20,
          background: 'var(--aurora-bento-bg)',
          border: '1px solid var(--aurora-bento-border)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h5 className="fw-light mb-0">Upload Aurora Content</h5>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              setVideoFile(null);
              setPosterFile(null);
              setTitle('');
              setType('intro');
              setVisibility('public');
              reset();
            }}
          >
            Clear
          </button>
        </div>

        {/* Drag & Drop zone */}
        <div
          className="mb-3 d-flex flex-column align-items-center justify-content-center text-center"
          style={{
            borderRadius: 16,
            border: `1px dashed var(--aurora-bento-border)`,
            padding: 18,
            background: dragOver ? 'rgba(255,255,255,0.06)' : 'transparent',
            transition: 'all 0.15s ease',
            minHeight: 140,
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onDrop(e.dataTransfer.files);
          }}
        >
          <div style={{ opacity: 0.75 }}>
            <div className="fw-semibold">Drag & drop here</div>
            <div style={{ fontSize: 13 }}>
              Drop <span className="fw-semibold">MP4</span> + <span className="fw-semibold">JPG/PNG</span> poster
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Video (MP4)</label>
            <input
              type="file"
              accept="video/mp4"
              className="form-control"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setVideoFile(f);
                if (f) setDefaultsFromVideo(f);
                reset();
              }}
            />
            {videoFile && (
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                {videoFile.name}
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label">Poster (JPG/PNG)</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="form-control"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setPosterFile(f);
                reset();
              }}
            />
            {posterFile && (
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                {posterFile.name}
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label">Title</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Aurora – Intro"
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Type</label>
            <select
              className="form-select"
              value={type}
              onChange={(e) => {
                setType(e.target.value as any);
                reset();
              }}
            >
              <option value="intro">intro</option>
              <option value="trailer">trailer</option>
              <option value="episode">episode</option>
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label">Visibility</label>
            <select
              className="form-select"
              value={visibility}
              onChange={(e) => {
                setVisibility(e.target.value as any);
                reset();
              }}
            >
              <option value="public">public</option>
              <option value="private">private</option>
            </select>
          </div>
        </div>

        {/* Progress */}
        {(state === 'uploading_video' || state === 'uploading_poster' || state === 'registering' || state === 'done') && (
          <div className="mt-3">
            <div className="mb-2" style={{ fontSize: 13, opacity: 0.75 }}>
              Video upload
            </div>
            <div className="progress mb-3">
              <div className="progress-bar" role="progressbar" style={{ width: `${videoProgress}%` }}>
                {videoProgress}%
              </div>
            </div>

            <div className="mb-2" style={{ fontSize: 13, opacity: 0.75 }}>
              Poster upload
            </div>
            <div className="progress">
              <div className="progress-bar" role="progressbar" style={{ width: `${posterProgress}%` }}>
                {posterProgress}%
              </div>
            </div>
          </div>
        )}

        {state === 'done' && (
          <div className="alert alert-success mt-3 mb-0">
            Uploaded & registered 🎉
          </div>
        )}

        {state === 'error' && (
          <div className="alert alert-danger mt-3 mb-0">
            {error}
          </div>
        )}

        <button
          className="btn btn-primary w-100 mt-3"
          disabled={!canUpload}
          onClick={startUpload}
        >
          {state === 'idle' && 'Upload & Register'}
          {state === 'signing_video' && 'Signing video…'}
          {state === 'uploading_video' && 'Uploading video…'}
          {state === 'signing_poster' && 'Signing poster…'}
          {state === 'uploading_poster' && 'Uploading poster…'}
          {state === 'registering' && 'Registering…'}
          {state === 'done' && 'Done'}
          {state === 'error' && 'Try again'}
        </button>

        <div className="mt-2" style={{ fontSize: 12, opacity: 0.6 }}>
          Uses GCS signed URLs → no large files touch Flask.
        </div>
      </div>
    </div>
  );
}
