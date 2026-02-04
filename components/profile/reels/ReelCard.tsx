// components/profile/reels/ReelCard.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

type Reel = {
  id: string;
  title: string;
  subtitle?: string | null;
  poster_url: string;
  video_url: string;
  view_count?: number;
  like_count?: number;
};

type Props = {
  reel: Reel;
  isActive: boolean;
};

export default function ReelCard({ reel, isActive }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasRegisteredViewRef = useRef(false);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reel.like_count || 0);

  const registerView = () => {
    if (hasRegisteredViewRef.current) return;
    hasRegisteredViewRef.current = true;

    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000'}/api/videos/${reel.id}/view`,
      { method: 'POST' }
    ).catch(() => {});
  };

  // ▶️ Play / pause
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (isActive) {
      v.play()
        .then(registerView) // 🎯 meaningful playback
        .catch(() => {});
    } else {
      v.pause();
    }
  }, [isActive]);

  const toggleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  return (
    <div
      className="reel-card position-relative"
      style={{
        height: '100%',
        width: '100%',
        background: 'black',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.poster_url}
        muted
        loop
        playsInline
        style={{
          height: '100%',
          width: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Bottom overlay */}
      <div
        className="position-absolute bottom-0 start-0 p-3"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
          width: '100%',
        }}
      >
        <div className="fw-semibold text-white">
          {reel.title}
        </div>
        {reel.subtitle && (
          <div className="small text-muted">
            {reel.subtitle}
          </div>
        )}
      </div>

      {/* Right rail */}
      <div
        className="position-absolute end-0 top-50 translate-middle-y d-flex flex-column align-items-center gap-3 p-3"
        style={{ color: 'white' }}
      >
        <button
          onClick={toggleLike}
          className="btn btn-sm btn-dark rounded-circle"
        >
          {liked ? '❤️' : '🤍'}
        </button>
        <div className="small">{likeCount}</div>

        <div className="text-center">
          <div>👁</div>
          <div className="small">
            {reel.view_count ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
}

