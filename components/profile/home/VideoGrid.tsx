// components/profile/home/VideoGrid.tsx

'use client';

import VideoCard from '@/components/profile/videos/VideoCard';

export default function VideoGrid() {
  return (
    <div>
      <h5 className="fw-light mb-3">
        Recommended for You
      </h5>

      <div className="row g-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="col-12 col-sm-6 col-lg-4 col-xl-3">
            <VideoCard video ={{} as any} />
          </div>
        ))}
      </div>
    </div>
  );
}
