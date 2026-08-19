import 'server-only';

import { cache } from 'react';
import { rolePermissionService } from '@/composition/access';
import { requirePlatformStaff } from './auth';

export const getRolesPageData = cache(async () => {
  await requirePlatformStaff(['owner', 'admin']);
  const [roles, permissions] = await Promise.all([
    rolePermissionService.listRoles(),
    rolePermissionService.listPermissions(),
  ]);

  return { roles, permissions };
});
