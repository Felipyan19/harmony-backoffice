'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/dal/auth';
import { userAdminService } from '@/composition/users';
import { createUserSchema, deleteUserSchema, updateUserSchema } from '@/modules/users/application/user-input';

function getRoles(formData: FormData) {
  return formData.getAll('roles').map(String);
}

export async function createUserAction(formData: FormData) {
  const actor = await requirePermission('users.manage');
  const input = createUserSchema.parse({
    displayName: formData.get('displayName'),
    email: formData.get('email'),
    password: formData.get('password'),
    phone: String(formData.get('phone') ?? '').trim() || undefined,
    roles: getRoles(formData),
  });

  await userAdminService.create({ ...input, actorProfileId: actor.profileId });
  revalidatePath('/usuarios');
}

export async function updateUserAction(formData: FormData) {
  const actor = await requirePermission('users.manage');
  const input = updateUserSchema.parse({
    userId: formData.get('userId'),
    displayName: formData.get('displayName'),
    phone: String(formData.get('phone') ?? '').trim() || undefined,
    status: formData.get('status'),
    roles: getRoles(formData),
  });

  if (input.userId === actor.userId && input.status === 'disabled') {
    throw new Error('No puedes desactivar tu propio usuario');
  }

  await userAdminService.update(input.userId, {
    displayName: input.displayName,
    phone: input.phone,
    status: input.status,
    roles: input.roles,
    actorProfileId: actor.profileId,
  });
  revalidatePath('/usuarios');
}

export async function deleteUserAction(formData: FormData) {
  const actor = await requirePermission('users.manage');
  const input = deleteUserSchema.parse({ userId: formData.get('userId') });

  if (input.userId === actor.userId) throw new Error('No puedes eliminar tu propio usuario');

  await userAdminService.remove(input.userId, actor.profileId);
  revalidatePath('/usuarios');
}
