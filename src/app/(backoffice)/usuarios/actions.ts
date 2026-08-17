'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/server';
import { ensureAccessProfile, hasPermission } from '@/composition/access';
import { userAdminService } from '@/composition/users';
import type { RoleCode } from '@/modules/access/domain/access';

const validRoles = new Set<RoleCode>(['admin','agent','receptionist']);

async function requireManager() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id || !session.user.email) throw new Error('No autenticado');
  const profile = await ensureAccessProfile.execute({ provider:'neon-auth', subject:session.user.id, email:session.user.email, displayName:session.user.name ?? session.user.email });
  if (profile.status !== 'active' || !(await hasPermission.execute(profile.profileId,'users.manage'))) throw new Error('No autorizado');
  return profile;
}

function parseRoles(formData: FormData): RoleCode[] {
  return formData.getAll('roles').map(String).filter((role): role is RoleCode => validRoles.has(role as RoleCode));
}

export async function createUserAction(formData: FormData) {
  const actor = await requireManager();
  const email=String(formData.get('email')??'').trim().toLowerCase();
  const password=String(formData.get('password')??'');
  const displayName=String(formData.get('displayName')??'').trim();
  const phone=String(formData.get('phone')??'').trim() || undefined;
  const roles=parseRoles(formData);
  if(!email.includes('@') || password.length<8 || !displayName || roles.length===0) throw new Error('Datos de usuario inválidos');
  await userAdminService.create({email,password,displayName,phone,roles,actorProfileId:actor.profileId});
  revalidatePath('/usuarios');
}

export async function updateUserAction(formData: FormData) {
  const actor=await requireManager();
  const userId=String(formData.get('userId')??'');
  if(userId===actor.userId && String(formData.get('status'))==='disabled') throw new Error('No puedes desactivar tu propio usuario');
  const roles=parseRoles(formData);
  if(!userId || !String(formData.get('displayName')??'').trim() || roles.length===0) throw new Error('Datos de usuario inválidos');
  await userAdminService.update(userId,{displayName:String(formData.get('displayName')).trim(),phone:String(formData.get('phone')??'').trim()||undefined,status:String(formData.get('status'))==='disabled'?'disabled':'active',roles,actorProfileId:actor.profileId});
  revalidatePath('/usuarios');
}

export async function deleteUserAction(formData: FormData) {
  const actor=await requireManager();
  const userId=String(formData.get('userId')??'');
  if(!userId || userId===actor.userId) throw new Error('No puedes eliminar tu propio usuario');
  await userAdminService.remove(userId,actor.profileId);
  revalidatePath('/usuarios');
}
