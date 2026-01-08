// app/admin/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import ProfileView from '@/components/admin/ProfileView';

export default function ProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  return <ProfileView id={id} />;
}
