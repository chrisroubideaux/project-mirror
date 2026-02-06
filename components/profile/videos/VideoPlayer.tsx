// components/profile/videos/VideoPlayer.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import ReelsRow from '@/components/profile/home/ReelsRow';
import {
  AiOutlineLike,
  AiFillLike,
  AiOutlineDislike,
  AiFillDislike,
  AiOutlineShareAlt,
} from 'react-icons/ai';

type Video = {
  id: string;
  title: string;
  description?: string | null;
  video_url: string;
  view_count?: number;
  like_count?: number;
};

type Props = {
  video: Video;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

const TOKEN_KEY = 'aurora_user_token';

export default function VideoPlayer({ video }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [liked, setLiked] = useState<boolean | null>(null);
  const [likeCount, setLikeCount] = useState(video.like_count ?? 0);
  const [pulse, setPulse] = useState(false);

  /* -----------------------------
     View registration (once)
  ----------------------------- */
  useEffect(() => {
    fetch(`${API_BASE}/api/videos/${video.id}/view`, {
      method: 'POST',
    }).catch(() => {});
  }, [video.id]);

  /* -----------------------------
     Like / Dislike (authoritative)
  ----------------------------- */
  const sendReaction = async (reaction: 'like' | 'dislike') => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/videos/${video.id}/react`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reaction }),
        }
      );

      if (!res.ok) {
        throw new Error('Reaction failed');
      }

      const data = await res.json();

      setLiked(data.reaction === 'like');
      setLikeCount(data.like_count);

      if (data.reaction === 'like') {
        setPulse(true);
        setTimeout(() => setPulse(false), 300);
      }
    } catch (err) {
      console.error('❌ Reaction error:', err);
    }
  };

  /* -----------------------------
     Share
  ----------------------------- */
  const handleShare = async () => {
    try {
      await fetch(`${API_BASE}/api/videos/${video.id}/share`, {
        method: 'POST',
      });

      await navigator.clipboard.writeText(
        `${window.location.origin}/profile/videos/${video.id}`
      );

      alert('Link copied to clipboard');
    } catch {
      alert('Failed to share');
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 24,
        height: '100%',
      }}
    >
      {/* ======================
         LEFT — VIDEO PLAYER
      ======================= */}
      <div>
        <div
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            background: '#000',
          }}
        >
          <video
            ref={videoRef}
            src={video.video_url}
            controls
            playsInline
            style={{
              width: '100%',
              maxHeight: '70vh',
              background: '#000',
            }}
          />
        </div>

        {/* ======================
           META + ACTIONS
        ======================= */}
        <div style={{ paddingTop: 16 }}>
          <h3 style={{ marginBottom: 6 }}>{video.title}</h3>

          <div
            style={{
              fontSize: 13,
              opacity: 0.6,
              marginBottom: 12,
            }}
          >
            {(video.view_count ?? 0).toLocaleString()} views
          </div>

          {/* ACTION BAR */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <ActionButton
              variant="like"
              active={liked === true}
              pulse={pulse}
              onClick={() => sendReaction('like')}
              icon={
                liked === true ? (
                  <AiFillLike size={18} />
                ) : (
                  <AiOutlineLike size={18} />
                )
              }
              label={likeCount.toString()}
            />

            <ActionButton
              variant="dislike"
              active={liked === false}
              onClick={() => sendReaction('dislike')}
              icon={
                liked === false ? (
                  <AiFillDislike size={18} />
                ) : (
                  <AiOutlineDislike size={18} />
                )
              }
            />

            <ActionButton
              variant="neutral"
              onClick={handleShare}
              icon={<AiOutlineShareAlt size={18} />}
              label="Share"
            />
          </div>

          {video.description && (
            <p
              style={{
                marginTop: 16,
                opacity: 0.75,
                lineHeight: 1.6,
              }}
            >
              {video.description}
            </p>
          )}
        </div>
      </div>

      {/* ======================
         RIGHT — REELS COLUMN
      ======================= */}
      <div
        style={{
          height: '100%',
          overflowY: 'auto',
          paddingRight: 6,
        }}
      >
        <h5 style={{ marginBottom: 12 }}>Reels</h5>
        <ReelsRow />
      </div>
    </div>
  );
}

/* =========================
   Action Button
========================= */

function ActionButton({
  icon,
  label,
  onClick,
  active,
  pulse,
  variant,
}: {
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
  active?: boolean;
  pulse?: boolean;
  variant: 'like' | 'dislike' | 'neutral';
}) {
  const styles = {
    like: {
      bg: 'rgba(0,180,255,0.15)',
      glow: '0 0 12px rgba(0,180,255,0.6)',
      color: '#00b4ff',
    },
    dislike: {
      bg: 'rgba(255,80,80,0.15)',
      glow: '0 0 12px rgba(255,80,80,0.6)',
      color: '#ff5050',
    },
    neutral: {
      bg: 'rgba(255,255,255,0.08)',
      glow: 'none',
      color: '#fff',
    },
  };

  const s = active ? styles[variant] : styles.neutral;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        border: 'none',
        borderRadius: 999,
        padding: '8px 14px',
        cursor: 'pointer',
        background: s.bg,
        color: s.color,
        boxShadow: active ? s.glow : 'none',
        fontSize: 14,
        transform: pulse ? 'scale(1.12)' : 'none',
        transition: 'all 0.25s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
      }}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}


{/*
'use client';

import { useEffect, useRef, useState } from 'react';
import ReelsRow from '@/components/profile/home/ReelsRow';

type Video = {
  id: string;
  title: string;
  description?: string | null;
  video_url: string;
  view_count?: number;
  like_count?: number;
};

type Props = {
  video: Video;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:5000';

export default function VideoPlayer({ video }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [liked, setLiked] = useState<boolean | null>(null);
  const [likeCount, setLikeCount] = useState(
    video.like_count ?? 0
  );

  
  useEffect(() => {
    fetch(`${API_BASE}/api/videos/${video.id}/view`, {
      method: 'POST',
    }).catch(() => {});
  }, [video.id]);

  
  const sendReaction = async (reaction: 'like' | 'dislike') => {
    setLiked(reaction === 'like');

    setLikeCount((prev) =>
      reaction === 'like' ? prev + 1 : Math.max(0, prev - 1)
    );

    fetch(`${API_BASE}/api/videos/${video.id}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction }),
    }).catch(() => {});
  };

  
  const handleShare = async () => {
    try {
      await fetch(`${API_BASE}/api/videos/${video.id}/share`, {
        method: 'POST',
      });

      await navigator.clipboard.writeText(
        `${window.location.origin}/videos/${video.id}`
      );

      alert('Link copied to clipboard');
    } catch {
      alert('Failed to share');
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 24,
        height: '100%',
      }}
    >
     
      <div>
        <div
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            background: '#000',
          }}
        >
          <video
            ref={videoRef}
            src={video.video_url}
            controls
            playsInline
            style={{
              width: '100%',
              maxHeight: '70vh',
              background: '#000',
            }}
          />
        </div>

      
        <div style={{ paddingTop: 16 }}>
          <h3 style={{ marginBottom: 6 }}>{video.title}</h3>

          <div
            style={{
              fontSize: 13,
              opacity: 0.6,
              marginBottom: 12,
            }}
          >
            {(video.view_count ?? 0).toLocaleString()} views
          </div>

        
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <ActionButton
              active={liked === true}
              label={`👍 ${likeCount}`}
              onClick={() => sendReaction('like')}
            />

            <ActionButton
              active={liked === false}
              label="👎"
              onClick={() => sendReaction('dislike')}
            />

            <ActionButton
              label="🔗 Share"
              onClick={handleShare}
            />
          </div>

          {video.description && (
            <p
              style={{
                marginTop: 16,
                opacity: 0.75,
                lineHeight: 1.6,
              }}
            >
              {video.description}
            </p>
          )}
        </div>
      </div>

    
      <div
        style={{
          height: '100%',
          overflowY: 'auto',
          paddingRight: 6,
        }}
      >
        <h5 style={{ marginBottom: 12 }}>Reels</h5>
        <ReelsRow />
      </div>
    </div>
  );
}


function ActionButton({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: 'none',
        borderRadius: 999,
        padding: '8px 14px',
        cursor: 'pointer',
        background: active
          ? 'var(--accent)'
          : 'rgba(255,255,255,0.08)',
        color: active ? '#000' : '#fff',
        fontSize: 14,
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </button>
  );
}
*/}
