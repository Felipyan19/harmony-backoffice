import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { ensureAccessProfile, hasPermission } from '@/composition/access';
import type { AccessProfile, PermissionCode } from '@/modules/access/domain/access';

export const verifySession = cache(async () => {
  const { data: session } = await auth.getSession();
  const user = session?.user;

  if (!user?.id || !user.email) redirect('/login');

  return {
    authSubject: user.id,
    email: user.email,
    displayName: user.name ?? user.email,
  };
});

export const getCurrentAccessProfile = cache(async (): Promise<AccessProfile> => {
  const session = await verifySession();
  const profile = await ensureAccessProfile.execute({
    provider: 'neon-auth',
    subject: session.authSubject,
    email: session.email,
    displayName: session.displayName,
  });

  if (profile.status !== 'active') throw new Error('Usuario desactivado');
  return profile;
});

export async function requirePermission(permission: PermissionCode): Promise<AccessProfile> {
  const profile = await getCurrentAccessProfile();
  const allowed = await hasPermission.execute(profile.profileId, permission);
  if (!allowed) throw new Error('No autorizado');
  return profile;
}
