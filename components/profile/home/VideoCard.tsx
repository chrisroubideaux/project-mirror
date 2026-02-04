// components/profile/home/VideoCard.tsx

'use client';

import { useRouter } from 'next/navigation';

type HomeVideo = {
  id: string;
  title: string;
  views: number;
  age: string;
};

export default function VideoCard() {
  const router = useRouter();

  // 🚧 mock
  const video: HomeVideo = {
    id: 'mock-video-id',
    title: 'Aurora: Episode One',
    views: 12000,
    age: '2 days ago',
  };

  return (
    <div
      className="rounded-4 overflow-hidden"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--aurora-bento-border)',
        cursor: 'pointer',
      }}
      onClick={() => router.push(`/videos/${video.id}`)}
    >
      <div
        style={{
          height: 160,
          background: '#222',
        }}
      />

      <div className="p-3">
        <div className="fw-semibold mb-1">
          {video.title}
        </div>
        <div className="small text-muted">
          {video.views.toLocaleString()} views · {video.age}
        </div>
      </div>
    </div>
  );
}
