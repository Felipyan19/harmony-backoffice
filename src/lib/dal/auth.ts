import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { accessRepository, hasPermission } from '@/composition/access';
import { workspaceService } from '@/composition/workspaces';
import type { AccessProfile, PermissionCode } from '@/modules/access/domain/access';
import type { PlatformRole, WorkspaceContext } from '@/modules/workspaces/domain/workspace';

export const WORKSPACE_COOKIE = 'ignite_workspace_id';

export type AccessState =
  | { state: 'anonymous' }
  | { state: 'granted'; profile: AccessProfile }
  | { state: 'disabled' }
  | { state: 'stale-session' }
  | { state: 'missing-profile' }
  | { state: 'missing-workspace' };

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

const getValidatedIdentity = cache(async (): Promise<AccessProfile | null> => {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const identity = await accessRepository.getIdentityByUserId(sessionUser.userId);
  if (!identity) return null;
  if (identity.status !== 'active') redirect('/login?acceso=deshabilitado');
  if (identity.sessionVersion !== sessionUser.sessionVersion) redirect('/login?acceso=sesion-expirada');
  return identity;
});

export const getCurrentWorkspaceContext = cache(async (): Promise<WorkspaceContext> => {
  const identity = await getValidatedIdentity();
  if (!identity) redirect('/login?acceso=sin-perfil');

  const [available, platformRole] = await Promise.all([
    workspaceService.listForProfile(identity.profileId),
    workspaceService.getPlatformRole(identity.profileId),
  ]);
  if (available.length === 0) redirect('/login?acceso=sin-negocio');

  const cookieStore = await cookies();
  const preferredId = cookieStore.get(WORKSPACE_COOKIE)?.value;
  const current = available.find((workspace) => workspace.id === preferredId) ?? available[0];
  const membership = await workspaceService.getMembership(identity.profileId, current.id);
  if (!membership || membership.status !== 'active') redirect('/login?acceso=sin-negocio');

  return {
    current,
    available,
    membership,
    platformRole: platformRole ?? undefined,
  };
});

export const getAccessState = cache(async (): Promise<AccessState> => {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return { state: 'anonymous' };

  const identity = await accessRepository.getIdentityByUserId(sessionUser.userId);
  if (!identity) return { state: 'missing-profile' };
  if (identity.status !== 'active') return { state: 'disabled' };
  if (identity.sessionVersion !== sessionUser.sessionVersion) return { state: 'stale-session' };

  const workspace = await getCurrentWorkspaceContext();
  const profile = await accessRepository.getByUserId(sessionUser.userId, workspace.current.id);
  if (!profile) return { state: 'missing-workspace' };
  return { state: 'granted', profile };
});

export const getCurrentAccessProfile = cache(async (): Promise<AccessProfile> => {
  const access = await getAccessState();

  if (access.state === 'anonymous') redirect('/login');
  if (access.state === 'disabled') redirect('/login?acceso=deshabilitado');
  if (access.state === 'stale-session') redirect('/login?acceso=sesion-expirada');
  if (access.state === 'missing-profile') redirect('/login?acceso=sin-perfil');
  if (access.state === 'missing-workspace') redirect('/login?acceso=sin-negocio');

  return access.profile;
});

export async function requirePermission(permission: PermissionCode): Promise<AccessProfile> {
  const [profile, workspace] = await Promise.all([getCurrentAccessProfile(), getCurrentWorkspaceContext()]);
  const allowed = await hasPermission.execute(profile.profileId, workspace.current.id, permission);
  if (!allowed) throw new Error('No autorizado');
  return profile;
}

export async function requirePlatformStaff(allowedRoles: PlatformRole[] = ['owner', 'admin', 'support']) {
  const identity = await getValidatedIdentity();
  if (!identity) redirect('/login');
  const platformRole = await workspaceService.getPlatformRole(identity.profileId);
  if (!platformRole || !allowedRoles.includes(platformRole)) throw new Error('No autorizado para administrar Ignite');
  return { profile: identity, platformRole };
}
