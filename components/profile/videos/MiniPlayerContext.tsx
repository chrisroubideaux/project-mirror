// components/profile/videos/MiniPlayerContext.tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

/**
 * This type matches what VideoPlayer passes in
 */
export type MiniPlayerVideo = {
  id: string;
  title: string;
  subtitle?: string | null;
  video_url: string;
};

type MiniPlayerContextType = {
  video: MiniPlayerVideo | null;
  setVideo: (video: MiniPlayerVideo | null) => void;
};

const MiniPlayerContext =
  createContext<MiniPlayerContextType | null>(null);

export function MiniPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [video, setVideo] = useState<MiniPlayerVideo | null>(
    () => {
      if (typeof window === 'undefined') return null;
      const stored = localStorage.getItem('mini-player-video');
      return stored ? JSON.parse(stored) : null;
    }
  );

  // Persist across refresh / route change
  useEffect(() => {
    if (video) {
      localStorage.setItem(
        'mini-player-video',
        JSON.stringify(video)
      );
    } else {
      localStorage.removeItem('mini-player-video');
    }
  }, [video]);

  return (
    <MiniPlayerContext.Provider value={{ video, setVideo }}>
      {children}
    </MiniPlayerContext.Provider>
  );
}

export function useMiniPlayer() {
  const ctx = useContext(MiniPlayerContext);
  if (!ctx) {
    throw new Error(
      'useMiniPlayer must be used inside MiniPlayerProvider'
    );
  }
  return ctx;
}
