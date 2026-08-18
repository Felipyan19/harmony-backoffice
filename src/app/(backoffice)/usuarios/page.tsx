import Link from 'next/link';
import { ShieldCheck, Users, Inbox, KeyRound } from 'lucide-react';
import { verifySession } from '@/lib/dal/auth';
import { getUsersPageData } from '@/lib/dal/users';
import { createUserAction, deleteUserAction, updateUserAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  await verifySession();

  let data: Awaited<ReturnType<typeof getUsersPageData>>;
  try {
    data = await getUsersPageData();
  } catch {
    return <AccessDenied />;
  }

  const { users, roles, canManage } = data;

  return <main className="flex min-h-screen bg-[#f4f5f2] text-zinc-900">
    <aside className="hidden min-h-screen w-[220px] shrink-0 flex-col bg-harmony-900 text-white lg:flex">
      <div className="flex h-[72px] items-center gap-3 border-b border-white/[0.07] px-4"><div className="grid h-9 w-9 place-items-center rounded-xl bg-gold-500 text-xs font-bold text-harmony-900">H</div><div><div className="text-[14px] font-semibold">Harmony</div><div className="text-[9px] text-white/45">Backoffice</div></div></div>
      <nav className="space-y-1 px-2.5 py-4 text-[11px]"><Link href="/conversaciones" className="flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-white/55 hover:bg-white/[0.05]"><Inbox size={17}/>Conversaciones</Link><Link href="/clientes" className="flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-white/55 hover:bg-white/[0.05]"><Users size={17}/>Clientes</Link><Link href="/usuarios" className="relative flex h-10 items-center gap-2.5 rounded-lg bg-white/[0.09] px-2.5 text-white"><span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-gold-400"/><ShieldCheck size={17} className="text-gold-300"/>Usuarios</Link><Link href="/roles" className="flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-white/55 hover:bg-white/[0.05]"><KeyRound size={17}/>Roles y permisos</Link></nav>
    </aside>
    <section className="min-w-0 flex-1 p-5 md:p-7"><div className="mx-auto max-w-6xl"><div className="mb-6"><h1 className="text-2xl font-semibold tracking-[-0.03em]">Usuarios</h1><p className="mt-1 text-[11px] text-zinc-500">Administra accesos, perfiles y roles del equipo Harmony.</p></div>
      {canManage ? <CreateUserForm roles={roles}/> : null}
      <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm"><div className="grid grid-cols-[1.2fr_1fr_.8fr_.8fr] gap-4 border-b bg-zinc-50/70 px-5 py-3 text-[9px] font-medium text-zinc-400"><span>Usuario</span><span>Roles</span><span>Estado</span><span>Acciones</span></div>{users.map((user)=><form key={user.userId} action={updateUserAction} className="grid grid-cols-[1.2fr_1fr_.8fr_.8fr] items-start gap-4 border-b px-5 py-4 last:border-b-0"><input type="hidden" name="userId" value={user.userId}/><div><input name="displayName" defaultValue={user.displayName} disabled={!canManage} className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-[11px] font-medium disabled:border-transparent disabled:bg-transparent"/><div className="mt-1 text-[9px] text-zinc-400">{user.email}</div><input name="phone" defaultValue={user.phone ?? ''} disabled={!canManage} placeholder="Teléfono" className="mt-2 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-[9px] disabled:hidden"/></div><div className="space-y-1">{roles.map((role)=><label key={role.code} className="flex items-center gap-1.5 text-[9px]"><input type="checkbox" name="roles" value={role.code} defaultChecked={user.roles.includes(role.code)} disabled={!canManage}/>{role.name}</label>)}</div><select name="status" defaultValue={user.status} disabled={!canManage} className="rounded-lg border border-zinc-200 px-2 py-1.5 text-[9px]"><option value="active">Activo</option><option value="disabled">Desactivado</option></select><div className="flex flex-wrap gap-2">{canManage?<><button className="rounded-lg bg-harmony-800 px-3 py-2 text-[9px] font-semibold text-white">Guardar</button><button formAction={deleteUserAction} className="rounded-lg border border-red-200 px-3 py-2 text-[9px] font-semibold text-red-700">Eliminar</button></>:<span className="text-[9px] text-zinc-400">Solo lectura</span>}</div></form>)}</div>
    </div></section>
  </main>;
}

function CreateUserForm({roles}:{roles:Array<{code:'admin'|'agent'|'receptionist';name:string;description?:string}>}) { return <form action={createUserAction} className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"><div className="mb-4 text-[12px] font-semibold">Crear usuario</div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><input name="displayName" required placeholder="Nombre" className="rounded-xl border border-zinc-200 px-3 py-2.5 text-[10px]"/><input name="email" type="email" required placeholder="Correo" className="rounded-xl border border-zinc-200 px-3 py-2.5 text-[10px]"/><input name="password" type="password" minLength={8} required placeholder="Contraseña temporal" autoComplete="new-password" className="rounded-xl border border-zinc-200 px-3 py-2.5 text-[10px]"/><input name="phone" placeholder="Teléfono" className="rounded-xl border border-zinc-200 px-3 py-2.5 text-[10px]"/></div><div className="mt-4 flex flex-wrap items-center gap-4">{roles.map((role)=><label key={role.code} className="flex items-center gap-2 text-[10px]"><input type="checkbox" name="roles" value={role.code}/>{role.name}</label>)}<button className="ml-auto rounded-xl bg-harmony-800 px-4 py-2.5 text-[10px] font-semibold text-white">Crear usuario</button></div></form> }
function AccessDenied(){return <main className="grid min-h-screen place-items-center bg-[#f4f5f2]"><div className="rounded-2xl border bg-white p-8 text-center"><ShieldCheck className="mx-auto text-zinc-300"/><h1 className="mt-3 font-semibold">Acceso restringido</h1><p className="mt-1 text-sm text-zinc-500">No tienes permiso para ver usuarios.</p></div></main>}
