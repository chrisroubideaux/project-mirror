// components/profile/reels/ReelsFeed.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import ReelCard from './ReelCard';

/* ================================
   Types
================================ */

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
  userId: string;
};

/* ================================
   Component
================================ */

export default function ReelsFeed({ userId }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [reels, setReels] = useState<Reel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  /* ================================
     Mock fetch layer (API-ready)
     Replace this with:
     GET /api/videos/member
  ================================ */

  useEffect(() => {
    // 🚧 TEMP mock data (drop-in replace later)
    const mockReels: Reel[] = [
      {
        id: '1',
        title: 'Projekt Aurora',
        subtitle: 'Teaser',
        poster_url: '/mock/poster1.jpg',
        video_url: '/mock/video1.mp4',
        view_count: 128,
        like_count: 12,
      },
      {
        id: '2',
        title: 'Memory Fragment',
        subtitle: 'Episode Zero',
        poster_url: '/mock/poster2.jpg',
        video_url: '/mock/video2.mp4',
        view_count: 94,
        like_count: 8,
      },
    ];

    setReels(mockReels);
  }, [userId]);

  /* ================================
     IntersectionObserver
     (rebinds when reels change)
  ================================ */

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // cleanup old observer
    observerRef.current?.disconnect();

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-reel-id');
            if (id) setActiveId(id);
          }
        });
      },
      {
        root,
        threshold: 0.6,
      }
    );

    observerRef.current = observer;

    const items = root.querySelectorAll('[data-reel-id]');
    items.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [reels]);

  /* ================================
     Render
  ================================ */

  return (
    <div
      ref={containerRef}
      className="reels-feed"
      style={{
        height: 'calc(100vh - 2rem)',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        scrollbarWidth: 'none',
      }}
    >
      {reels.map(reel => (
        <div
          key={reel.id}
          data-reel-id={reel.id}
          style={{
            height: '100%',
            scrollSnapAlign: 'start',
          }}
        >
          <ReelCard
            reel={reel}
            isActive={activeId === reel.id}
          />
        </div>
      ))}
    </div>
  );
}
