import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export default async function BackofficeLayout({ children }: { children: ReactNode }) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect('/login');

  return children;
}
