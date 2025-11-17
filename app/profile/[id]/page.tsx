'use client';

import { useParams } from 'next/navigation';
import ProfileView from '@/components/profile/ProfileView';

export default function ProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  return <ProfileView id={id} />;
}
