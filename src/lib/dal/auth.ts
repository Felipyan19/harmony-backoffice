import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { hasPermission, resolveAccessProfile } from '@/composition/access';
import type { AccessDenialReason } from '@/modules/access/application/ports/access-repository';
import type { AccessProfile, PermissionCode } from '@/modules/access/domain/access';

const PROVIDER = 'neon-auth';

export type AccessState =
  | { state: 'anonymous' }
  | { state: 'granted'; profile: AccessProfile }
  | { state: 'denied'; reason: AccessDenialReason }
  | { state: 'disabled' };

export const getSessionUser = cache(async () => {
  const { data: session } = await auth.getSession();
  const user = session?.user;
  if (!user?.id || !user.email) return null;

  return {
    authSubject: user.id,
    email: user.email,
    displayName: user.name ?? user.email,
  };
});

export const verifySession = cache(async () => {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
});

/**
 * Non-redirecting access lookup. The login page needs it to avoid bouncing a
 * signed-in user with no RBAC profile back and forth between /login and the app.
 */
export const getAccessState = cache(async (): Promise<AccessState> => {
  const user = await getSessionUser();
  if (!user) return { state: 'anonymous' };

  const resolution = await resolveAccessProfile.execute({
    provider: PROVIDER,
    subject: user.authSubject,
    email: user.email,
  });

  if (!resolution.granted) return { state: 'denied', reason: resolution.reason };
  if (resolution.profile.status !== 'active') return { state: 'disabled' };
  return { state: 'granted', profile: resolution.profile };
});

export const getCurrentAccessProfile = cache(async (): Promise<AccessProfile> => {
  const access = await getAccessState();

  if (access.state === 'anonymous') redirect('/login');
  if (access.state === 'disabled') redirect('/login?acceso=deshabilitado');
  if (access.state === 'denied') redirect(`/login?acceso=${access.reason}`);

  return access.profile;
});

export async function requirePermission(permission: PermissionCode): Promise<AccessProfile> {
  const profile = await getCurrentAccessProfile();
  const allowed = await hasPermission.execute(profile.profileId, permission);
  if (!allowed) throw new Error('No autorizado');
  return profile;
}
