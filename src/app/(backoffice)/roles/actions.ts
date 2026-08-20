'use server';

import { revalidatePath } from 'next/cache';
import { requirePlatformStaff } from '@/lib/dal/auth';
import { rolePermissionService } from '@/composition/access';
import { updateRolePermissionsSchema } from '@/modules/access/application/role-permission-input';

export async function updateRolePermissionsAction(formData: FormData) {
  const actor = await requirePlatformStaff(['owner', 'admin']);
  const input = updateRolePermissionsSchema.parse({
    roleCode: formData.get('roleCode'),
    permissions: formData.getAll('permissions').map(String),
  });

  await rolePermissionService.setRolePermissions(input.roleCode, input.permissions, actor.profile.profileId);
  revalidatePath('/usuarios');
}
