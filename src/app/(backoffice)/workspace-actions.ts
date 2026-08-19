'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentWorkspaceContext, WORKSPACE_COOKIE } from '@/lib/dal/auth';

export async function switchWorkspaceAction(formData: FormData) {
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const context = await getCurrentWorkspaceContext();
  if (!context.available.some((workspace) => workspace.id === workspaceId)) {
    throw new Error('No tienes acceso a ese negocio');
  }

  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  });
  revalidatePath('/', 'layout');
  redirect('/');
}
