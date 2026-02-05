// components/profile/home/FeaturedTrailer.tsx
'use client';

import { useEffect, useState } from 'react';
import VideoCard from '@/components/profile/videos/VideoCard';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

type FeaturedVideo = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  poster_url: string;
  video_url?: string;
  duration?: string | null;
  aspect_ratio?: string | null;
  type: string;
  visibility: string;
  created_at: string;
  series_avatar_url?: string | null;
  view_count?: number;
};

export default function FeaturedTrailer() {
  const [video, setVideo] =
    useState<FeaturedVideo | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/videos`);
        if (!res.ok) return;

        const videos = (await res.json()) as FeaturedVideo[];

        // Public endpoint already returns trailers only
        if (videos.length > 0) {
          setVideo(videos[0]);
        }
      } catch (err) {
        console.error(
          'Failed to load featured trailer',
          err
        );
      }
    })();
  }, []);

  if (!video) return null;

  return (
    <div>
      <h5 className="fw-light mb-3">Featured</h5>

      <VideoCard video={video} />
    </div>
  );
}


{/*
// components/profile/home/FeaturedTrailer.tsx
'use client';

import { useEffect, useState } from 'react';
import VideoCard, {
  type PublicVideo,
} from '@/components/videos/VideoCard';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

export default function FeaturedTrailer() {
  const [video, setVideo] = useState<PublicVideo | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/videos`);
        if (!res.ok) return;

        const videos = (await res.json()) as PublicVideo[];

        // Public API already returns trailers only
        if (videos.length > 0) {
          setVideo(videos[0]);
        }
      } catch (err) {
        console.error('Failed to load featured trailer', err);
      }
    })();
  }, []);

  if (!video) return null;

  return (
    <div>
      <h5 className="fw-light mb-3">Featured</h5>

     
      <VideoCard video={video} />
    </div>
  );
}



*/}