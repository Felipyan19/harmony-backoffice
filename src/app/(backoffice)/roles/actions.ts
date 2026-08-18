'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/dal/auth';
import { rolePermissionService } from '@/composition/access';
import { updateRolePermissionsSchema } from '@/modules/access/application/role-permission-input';

export async function updateRolePermissionsAction(formData: FormData) {
  const actor = await requirePermission('roles.manage');
  const input = updateRolePermissionsSchema.parse({
    roleCode: formData.get('roleCode'),
    permissions: formData.getAll('permissions').map(String),
  });

  const editsOwnRole = actor.roles.includes(input.roleCode);
  const keepsRolesManage = input.permissions.includes('roles.manage');
  if (editsOwnRole && !keepsRolesManage) {
    const roles = await rolePermissionService.listRoles();
    const retainsAccessElsewhere = actor.roles
      .filter((role) => role !== input.roleCode)
      .some((role) => roles.find((item) => item.code === role)?.permissions.includes('roles.manage'));
    if (!retainsAccessElsewhere) {
      throw new Error('No puedes quitarte a ti mismo el permiso roles.manage');
    }
  }

  await rolePermissionService.setRolePermissions(input.roleCode, input.permissions, actor.profileId);
  revalidatePath('/usuarios');
}
