import type { ReactNode } from 'react';
import { getCurrentAccessProfile } from '@/lib/dal/auth';

export const dynamic = 'force-dynamic';

export default async function BackofficeLayout({ children }: { children: ReactNode }) {
  await getCurrentAccessProfile();
  return children;
}
