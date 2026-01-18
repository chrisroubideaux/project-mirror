// app/videos/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VideoPlayer, {
  type PlaybackVideo,
} from '@/components/videos/VideoPlayer';

export default function VideoWatchPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [video, setVideo] = useState<PlaybackVideo | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:5000/api/videos/${id}`) // ✅ CORRECT BACKEND
      .then((res) => {
        if (!res.ok) throw new Error('Video not found');
        return res.json();
      })
      .then((data) => setVideo(data))
      .catch(() => router.push('/404'));
  }, [id, router]);

  if (!video) return null;

  return (
    <VideoPlayer
      video={video}
      onClose={() => router.push('/')}
    />
  );
}

