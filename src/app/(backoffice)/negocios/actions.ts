'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { workspaceService } from '@/composition/workspaces';
import { requirePlatformStaff, WORKSPACE_COOKIE } from '@/lib/dal/auth';
import { createWorkspaceSchema } from '@/modules/workspaces/application/workspace-input';

export async function createWorkspaceAction(formData: FormData) {
  const actor = await requirePlatformStaff(['owner', 'admin']);
  const input = createWorkspaceSchema.parse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    logoUrl: formData.get('logoUrl'),
    primaryColor: formData.get('primaryColor'),
    secondaryColor: formData.get('secondaryColor'),
    accentColor: formData.get('accentColor'),
    adminEmail: formData.get('adminEmail'),
    adminDisplayName: formData.get('adminDisplayName'),
    adminPassword: formData.get('adminPassword'),
  });

  const workspace = await workspaceService.create({ ...input, actorProfileId: actor.profile.profileId });
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, workspace.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  });

  revalidatePath('/', 'layout');
  redirect('/');
}
