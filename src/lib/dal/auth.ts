import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { accessRepository, hasPermission } from '@/composition/access';
import type { AccessProfile, PermissionCode } from '@/modules/access/domain/access';

export type AccessState =
  | { state: 'anonymous' }
  | { state: 'granted'; profile: AccessProfile }
  | { state: 'disabled' }
  | { state: 'stale-session' }
  | { state: 'missing-profile' };

export const getSessionUser = cache(async () => {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) return null;

  return {
    userId: user.id,
    email: user.email,
    displayName: user.name ?? user.email,
    sessionVersion: user.sessionVersion,
  };
});

export const verifySession = cache(async () => {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
});

export const getAccessState = cache(async (): Promise<AccessState> => {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return { state: 'anonymous' };

  const profile = await accessRepository.getByUserId(sessionUser.userId);
  if (!profile) return { state: 'missing-profile' };
  if (profile.status !== 'active') return { state: 'disabled' };
  if (profile.sessionVersion !== sessionUser.sessionVersion) return { state: 'stale-session' };

  return { state: 'granted', profile };
});

export const getCurrentAccessProfile = cache(async (): Promise<AccessProfile> => {
  const access = await getAccessState();

  if (access.state === 'anonymous') redirect('/login');
  if (access.state === 'disabled') redirect('/login?acceso=deshabilitado');
  if (access.state === 'stale-session') redirect('/login?acceso=sesion-expirada');
  if (access.state === 'missing-profile') redirect('/login?acceso=sin-perfil');

  return access.profile;
});

export async function requirePermission(permission: PermissionCode): Promise<AccessProfile> {
  const profile = await getCurrentAccessProfile();
  const allowed = await hasPermission.execute(profile.profileId, permission);
  if (!allowed) throw new Error('No autorizado');
  return profile;
}
