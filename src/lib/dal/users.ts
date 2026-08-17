import 'server-only';

import { cache } from 'react';
import { userAdminService } from '@/composition/users';
import { getCurrentAccessProfile, requirePermission } from './auth';

export interface UserListDTO {
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  status: 'active' | 'disabled';
  roles: Array<'admin' | 'agent' | 'receptionist'>;
  createdAt: string;
}

export const getUsersPageData = cache(async () => {
  const actor = await requirePermission('users.read');
  const [users, roles] = await Promise.all([
    userAdminService.list(),
    userAdminService.listRoles(),
  ]);

  const canManage = await (async () => {
    try {
      await requirePermission('users.manage');
      return true;
    } catch {
      return false;
    }
  })();

  return {
    actor: { userId: actor.userId, profileId: actor.profileId, displayName: actor.displayName },
    canManage,
    roles: roles.map((role) => ({ code: role.code, name: role.name, description: role.description })),
    users: users.map((user): UserListDTO => ({
      userId: user.userId,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      roles: user.roles,
      createdAt: user.createdAt,
    })),
  };
});

export const getCurrentUserDTO = cache(async () => {
  const profile = await getCurrentAccessProfile();
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    roles: profile.roles,
  };
});
