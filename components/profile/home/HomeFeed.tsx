// components/profile/home/HomeFeed.tsx
// components/profile/home/HomeFeed.tsx
'use client';

import ContinueWatching from './ContinueWatching';
import FeaturedTrailer from './FeaturedTrailer';
import ReelsRow from './ReelsRow';
import VideoGrid from './VideoGrid';
import AuroraInsightCard from './AuroraInsightCard';

type Props = {
  userId: string;
};

export default function HomeFeed({ userId }: Props) {
  return (
    <div className="d-flex flex-column gap-5">
      <ContinueWatching />
      <FeaturedTrailer />
      <ReelsRow />
      <VideoGrid />
      <AuroraInsightCard />
    </div>
  );
}
