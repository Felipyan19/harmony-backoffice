import Link from 'next/link';
import type { Metadata } from 'next';
import { KeyRound, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { verifySession } from '@/lib/dal/auth';
import { getUsersPageData } from '@/lib/dal/users';
import { getRolesPageData } from '@/lib/dal/roles';
import type { PermissionOption, RoleWithPermissions } from '@/modules/access/domain/access';
import { Button, Checkbox, Select, TextField } from '@/modules/shared/ui';
import { createUserAction, deleteUserAction, updateUserAction } from './actions';
import { updateRolePermissionsAction } from '../roles/actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Usuarios' };

type Tab = 'usuarios' | 'roles';

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await verifySession();
  const { tab } = await searchParams;

  let usersData: Awaited<ReturnType<typeof getUsersPageData>>;
  try {
    usersData = await getUsersPageData();
  } catch {
    return <AccessDenied />;
  }

  let rolesData: Awaited<ReturnType<typeof getRolesPageData>> | null = null;
  try {
    rolesData = await getRolesPageData();
  } catch {
    rolesData = null;
  }

  const activeTab: Tab = tab === 'roles' && rolesData ? 'roles' : 'usuarios';
  const { users, roles, canManage } = usersData;

  return <div className="min-h-0 flex-1 overflow-auto p-5 md:p-7"><div className="mx-auto max-w-6xl">
    <div className="mb-5 flex gap-1 border-b border-neutral/12">
      <TabLink href="/usuarios" active={activeTab === 'usuarios'} icon={<ShieldCheck size={14} />} label="Usuarios" />
      {rolesData ? <TabLink href="/usuarios?tab=roles" active={activeTab === 'roles'} icon={<KeyRound size={14} />} label="Roles y permisos" /> : null}
    </div>

    {activeTab === 'roles' && rolesData
      ? <RolesTab roles={rolesData.roles} permissions={rolesData.permissions} />
      : <>
        {canManage ? <CreateUserForm roles={roles} /> : null}
        <div className="mt-5 overflow-hidden rounded-2xl border border-neutral/12 bg-white shadow-sm">
          <div className="grid grid-cols-[1.2fr_1fr_.8fr_.8fr] gap-4 border-b border-neutral/10 bg-neutral/4 px-5 py-3 text-sm font-medium text-neutral/40">
            <span>Usuario</span><span>Roles</span><span>Estado</span><span>Acciones</span>
          </div>
          {users.map((user) => (
            <form key={user.userId} action={updateUserAction} className="grid grid-cols-[1.2fr_1fr_.8fr_.8fr] items-start gap-4 border-b border-neutral/10 px-5 py-4 last:border-b-0">
              <input type="hidden" name="userId" value={user.userId} />
              <div>
                <TextField name="displayName" defaultValue={user.displayName} disabled={!canManage} className="font-medium" />
                <div className="mt-1 text-sm text-neutral/40">{user.email}</div>
                <TextField name="phone" type="tel" defaultValue={user.phone ?? ''} disabled={!canManage} placeholder="Teléfono" className="disabled:hidden" containerClassName="mt-2" />
              </div>
              <div className="space-y-1">
                {roles.map((role) => (
                  <Checkbox key={role.code} name="roles" value={role.code} defaultChecked={user.roles.includes(role.code)} disabled={!canManage} label={role.name} />
                ))}
              </div>
              <Select name="status" defaultValue={user.status} disabled={!canManage}>
                <option value="active">Activo</option>
                <option value="disabled">Desactivado</option>
              </Select>
              <div className="flex flex-wrap gap-2">
                {canManage ? (
                  <>
                    <Button type="submit">Guardar</Button>
                    <Button type="submit" formAction={deleteUserAction} variant="danger">Eliminar</Button>
                  </>
                ) : (
                  <span className="text-sm text-neutral/40">Solo lectura</span>
                )}
              </div>
            </form>
          ))}
        </div>
      </>}
  </div></div>;
}

function TabLink({ href, active, icon, label }: { href: string; active: boolean; icon: ReactNode; label: string }) {
  return <Link href={href} className={`flex items-center gap-1.5 border-b-2 px-3 pb-2.5 text-sm font-medium transition ${active ? 'border-primary text-primary' : 'border-transparent text-neutral/60 hover:text-neutral'}`}>{icon}{label}</Link>;
}

function CreateUserForm({ roles }: { roles: Array<{ code: 'admin' | 'agent' | 'receptionist'; name: string; description?: string }> }) {
  return (
    <form action={createUserAction} className="rounded-2xl border border-neutral/12 bg-white p-5 shadow-sm">
      <div className="mb-4 text-base font-semibold">Crear usuario</div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TextField name="displayName" required placeholder="Nombre" />
        <TextField name="email" type="email" required placeholder="Correo" />
        <TextField name="password" type="password" minLength={8} required placeholder="Contraseña temporal" autoComplete="new-password" />
        <TextField name="phone" type="tel" placeholder="Teléfono" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {roles.map((role) => <Checkbox key={role.code} name="roles" value={role.code} label={role.name} />)}
        <Button type="submit" className="ml-auto">Crear usuario</Button>
      </div>
    </form>
  );
}

function RolesTab({ roles, permissions }: { roles: RoleWithPermissions[]; permissions: PermissionOption[] }) {
  const groups = groupPermissionsByCategory(permissions);
  return <div className="grid gap-5 lg:grid-cols-3">
    {roles.map((role) => <RoleCard key={role.code} role={role} groups={groups} />)}
  </div>;
}

function RoleCard({ role, groups }: { role: RoleWithPermissions; groups: Array<{ category: string; items: PermissionOption[] }> }) {
  return <form action={updateRolePermissionsAction} className="flex flex-col rounded-2xl border border-neutral/12 bg-white p-5 shadow-sm">
    <input type="hidden" name="roleCode" value={role.code} />
    <div className="mb-1 text-base font-semibold">{role.name}</div>
    {role.description ? <p className="mb-3 text-sm text-neutral/60">{role.description}</p> : null}
    <div className="flex-1 space-y-3">
      {groups.map((group) => <div key={group.category}>
        <div className="mb-1.5 text-sm font-semibold uppercase tracking-[0.14em] text-neutral/40">{group.category}</div>
        <div className="space-y-1">
          {group.items.map((permission) => (
            <Checkbox key={permission.code} name="permissions" value={permission.code} defaultChecked={role.permissions.includes(permission.code)} label={permission.name} />
          ))}
        </div>
      </div>)}
    </div>
    <Button type="submit" className="mt-4">Guardar</Button>
  </form>;
}

function groupPermissionsByCategory(permissions: PermissionOption[]) {
  const map = new Map<string, PermissionOption[]>();
  for (const permission of permissions) {
    const category = permission.code.split('.')[0];
    const list = map.get(category) ?? [];
    list.push(permission);
    map.set(category, list);
  }
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
}

function AccessDenied(){return <div className="grid min-h-0 flex-1 place-items-center p-5"><div className="rounded-2xl border border-neutral/12 bg-white p-8 text-center"><ShieldCheck className="mx-auto text-neutral/30"/><h1 className="mt-3 text-lg font-semibold">Acceso restringido</h1><p className="mt-1 text-sm text-neutral/60">No tienes permiso para ver usuarios.</p></div></div>}
