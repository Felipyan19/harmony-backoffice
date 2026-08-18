import 'server-only';

import { cache } from 'react';
import { rolePermissionService } from '@/composition/access';
import { requirePermission } from './auth';

export const getRolesPageData = cache(async () => {
  await requirePermission('roles.manage');
  const [roles, permissions] = await Promise.all([
    rolePermissionService.listRoles(),
    rolePermissionService.listPermissions(),
  ]);

  return { roles, permissions };
});
