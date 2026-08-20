'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentWorkspaceContext, requirePermission } from '@/lib/dal/auth';
import { userAdminService } from '@/composition/users';
import { createUserSchema, deleteUserSchema, updateUserSchema } from '@/modules/users/application/user-input';

function getRoles(formData: FormData) {
  return formData.getAll('roles').map(String);
}

export async function createUserAction(formData: FormData) {
  const [actor, workspace] = await Promise.all([requirePermission('users.manage'), getCurrentWorkspaceContext()]);
  const input = createUserSchema.parse({
    displayName: formData.get('displayName'),
    email: formData.get('email'),
    password: formData.get('password'),
    phone: String(formData.get('phone') ?? '').trim() || undefined,
    roles: getRoles(formData),
  });

  await userAdminService.create(workspace.current.id, { ...input, actorProfileId: actor.profileId });
  revalidatePath('/usuarios');
}

export async function updateUserAction(formData: FormData) {
  const [actor, workspace] = await Promise.all([requirePermission('users.manage'), getCurrentWorkspaceContext()]);
  const input = updateUserSchema.parse({
    userId: formData.get('userId'),
    displayName: formData.get('displayName'),
    phone: String(formData.get('phone') ?? '').trim() || undefined,
    status: formData.get('status'),
    roles: getRoles(formData),
  });

  if (input.userId === actor.userId && input.status === 'disabled') {
    throw new Error('No puedes desactivar tu propia membresía');
  }

  await userAdminService.update(workspace.current.id, input.userId, {
    displayName: input.displayName,
    phone: input.phone,
    status: input.status,
    roles: input.roles,
    actorProfileId: actor.profileId,
  });
  revalidatePath('/usuarios');
}

export async function deleteUserAction(formData: FormData) {
  const [actor, workspace] = await Promise.all([requirePermission('users.manage'), getCurrentWorkspaceContext()]);
  const input = deleteUserSchema.parse({ userId: formData.get('userId') });

  if (input.userId === actor.userId) throw new Error('No puedes quitarte del negocio actual');

  await userAdminService.remove(workspace.current.id, input.userId, actor.profileId);
  revalidatePath('/usuarios');
}
