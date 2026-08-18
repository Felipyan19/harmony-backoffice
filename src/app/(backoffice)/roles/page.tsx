import Link from 'next/link';
import { ShieldCheck, Users, Inbox, KeyRound } from 'lucide-react';
import { verifySession } from '@/lib/dal/auth';
import { getRolesPageData } from '@/lib/dal/roles';
import type { PermissionOption, RoleWithPermissions } from '@/modules/access/domain/access';
import { updateRolePermissionsAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function RolesPage() {
  await verifySession();

  let data: Awaited<ReturnType<typeof getRolesPageData>>;
  try {
    data = await getRolesPageData();
  } catch {
    return <AccessDenied />;
  }

  const { roles, permissions } = data;
  const groups = groupPermissionsByCategory(permissions);

  return <main className="flex min-h-screen bg-[#f4f5f2] text-zinc-900">
    <aside className="hidden min-h-screen w-[220px] shrink-0 flex-col bg-harmony-900 text-white lg:flex">
      <div className="flex h-[72px] items-center gap-3 border-b border-white/[0.07] px-4"><div className="grid h-9 w-9 place-items-center rounded-xl bg-gold-500 text-xs font-bold text-harmony-900">H</div><div><div className="text-[14px] font-semibold">Harmony</div><div className="text-[9px] text-white/45">Backoffice</div></div></div>
      <nav className="space-y-1 px-2.5 py-4 text-[11px]">
        <Link href="/conversaciones" className="flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-white/55 hover:bg-white/[0.05]"><Inbox size={17}/>Conversaciones</Link>
        <Link href="/clientes" className="flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-white/55 hover:bg-white/[0.05]"><Users size={17}/>Clientes</Link>
        <Link href="/usuarios" className="flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-white/55 hover:bg-white/[0.05]"><ShieldCheck size={17}/>Usuarios</Link>
        <Link href="/roles" className="relative flex h-10 items-center gap-2.5 rounded-lg bg-white/[0.09] px-2.5 text-white"><span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-gold-400"/><KeyRound size={17} className="text-gold-300"/>Roles y permisos</Link>
      </nav>
    </aside>
    <section className="min-w-0 flex-1 p-5 md:p-7"><div className="mx-auto max-w-6xl">
      <div className="mb-6"><h1 className="text-2xl font-semibold tracking-[-0.03em]">Roles y permisos</h1><p className="mt-1 text-[11px] text-zinc-500">Define qué puede hacer cada rol dentro de Harmony.</p></div>
      <div className="grid gap-5 lg:grid-cols-3">
        {roles.map((role) => <RoleCard key={role.code} role={role} groups={groups} />)}
      </div>
    </div></section>
  </main>;
}

function RoleCard({ role, groups }: { role: RoleWithPermissions; groups: Array<{ category: string; items: PermissionOption[] }> }) {
  return <form action={updateRolePermissionsAction} className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
    <input type="hidden" name="roleCode" value={role.code} />
    <div className="mb-1 text-[13px] font-semibold">{role.name}</div>
    {role.description ? <p className="mb-3 text-[10px] text-zinc-500">{role.description}</p> : null}
    <div className="flex-1 space-y-3">
      {groups.map((group) => <div key={group.category}>
        <div className="mb-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{group.category}</div>
        <div className="space-y-1">
          {group.items.map((permission) => <label key={permission.code} className="flex items-center gap-2 text-[10px]">
            <input type="checkbox" name="permissions" value={permission.code} defaultChecked={role.permissions.includes(permission.code)} />
            <span>{permission.name}</span>
          </label>)}
        </div>
      </div>)}
    </div>
    <button className="mt-4 rounded-lg bg-harmony-800 px-3 py-2 text-[10px] font-semibold text-white">Guardar</button>
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

function AccessDenied() {
  return <main className="grid min-h-screen place-items-center bg-[#f4f5f2]"><div className="rounded-2xl border bg-white p-8 text-center"><ShieldCheck className="mx-auto text-zinc-300"/><h1 className="mt-3 font-semibold">Acceso restringido</h1><p className="mt-1 text-sm text-zinc-500">No tienes permiso para gestionar roles y permisos.</p></div></main>;
}
