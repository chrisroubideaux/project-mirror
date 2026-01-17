// components/guest/IntroGrid.tsx
// components/guest/IntroGrid.tsx
'use client';

import { useEffect, useState } from 'react';
import AuroraAvatar from '@/components/avatar/AuroraAvatar';
import VideoPlayer from '@/components/videos/VideoPlayer';

type PublicVideo = {
  id: string;
  title: string;
  subtitle?: string | null;
  poster_url: string | null;
  video_url: string;
  type?: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function IntroGrid() {
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] =
    useState<PublicVideo | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/videos`)
      .then((r) => r.json())
      .then((data: PublicVideo[]) => {
        setVideos(
          data.map((v) => ({
            ...v,
            video_url: v.video_url.trim(),
            poster_url: v.poster_url?.trim() ?? null,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <>
      <div className="row g-4 justify-content-center">
        {videos.map((v) => (
          <div key={v.id} className="col-md-4">
            <AuroraAvatar
              title={v.title}
              subtitle={v.subtitle ?? undefined}
              poster={
                v.poster_url || '/placeholders/video-poster.jpg'
              }
              videoSrc={v.video_url}
              type={v.type as any}
              onPlay={(video) =>
                setActiveVideo({
                  ...v,
                  video_url: video.video_url,
                })
              }
            />
          </div>
        ))}
      </div>

      {activeVideo && (
        <VideoPlayer
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </>
  );
}
