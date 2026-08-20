'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type CSSProperties, type ReactNode } from 'react';
import { Bell, Building2, Inbox, LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react';
import { BrandIcon } from '@/components/brand-icon';
import { authClient } from '@/lib/auth/client';
import { switchWorkspaceAction } from '@/app/(backoffice)/workspace-actions';
import type { PlatformRole, WorkspaceSummary } from '@/modules/workspaces/domain/workspace';
import { CountBadge, Popover } from '@/modules/shared/ui';
import { useBackofficeState } from './backoffice-context';

const BASE_NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: LayoutDashboard, withUnreadBadge: false },
  { href: '/conversaciones', label: 'Conversaciones', icon: Inbox, withUnreadBadge: true },
  { href: '/clientes', label: 'Clientes', icon: Users, withUnreadBadge: false },
  { href: '/usuarios', label: 'Usuarios', icon: ShieldCheck, withUnreadBadge: false },
] as const;

type ShellUser = { displayName: string; roleLabel: string; initials: string };

export function BackofficeShell({
  children,
  user,
  workspace,
  availableWorkspaces,
  platformRole,
}: {
  children: ReactNode;
  user: ShellUser;
  workspace: WorkspaceSummary;
  availableWorkspaces: WorkspaceSummary[];
  platformRole?: PlatformRole;
}) {
  const pathname = usePathname();
  const { customers, conversations, unreadCount } = useBackofficeState();
  const canManagePlatform = platformRole === 'owner' || platformRole === 'admin';
  const navItems = canManagePlatform
    ? [...BASE_NAV_ITEMS, { href: '/negocios', label: 'Negocios', icon: Building2, withUnreadBadge: false } as const]
    : BASE_NAV_ITEMS;

  const pageMeta = getPageMeta(pathname, workspace.name);
  const style = {
    '--color-primary': workspace.branding.primaryColor,
    '--color-primary-dark': workspace.branding.secondaryColor,
    '--color-label-gold': workspace.branding.accentColor,
  } as CSSProperties;

  return (
    <main style={style} className="flex h-screen overflow-hidden bg-[#f3f2ee] text-neutral">
      <aside className="hidden h-screen w-[220px] shrink-0 flex-col border-r border-white/[0.07] bg-[var(--color-primary-dark)] text-white lg:flex">
        <div className="flex min-h-16 items-center gap-3 border-b border-white/[0.07] px-4 py-3">
          {workspace.branding.logoUrl ? (
            <img src={workspace.branding.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
          ) : (
            <BrandIcon size={36} className="shrink-0 rounded-md" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold tracking-[-0.02em]">{workspace.name}</div>
            <div className="mt-0.5 text-sm text-white/45">Backoffice</div>
          </div>
        </div>

        {availableWorkspaces.length > 1 ? (
          <form action={switchWorkspaceAction} className="border-b border-white/[0.07] px-3 py-3">
            <label className="mb-1 block text-sm font-medium text-white/35">Negocio actual</label>
            <select
              name="workspaceId"
              defaultValue={workspace.id}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
              className="w-full rounded-md border border-white/10 bg-white/[0.07] px-2 py-2 text-sm text-white outline-none"
            >
              {availableWorkspaces.map((item) => <option key={item.id} value={item.id} className="text-neutral">{item.name}</option>)}
            </select>
          </form>
        ) : null}

        <nav className="px-2.5 py-4" aria-label="Principal">
          <div className="mb-2 px-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-white/30">Principal</div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                active={pathname === item.href}
                icon={<item.icon size={17} />}
                label={item.label}
                badge={item.withUnreadBadge ? unreadCount : 0}
              />
            ))}
          </div>
        </nav>

        <div className="mt-auto border-t border-white/[0.07] px-2.5 pb-2.5 pt-3">
          <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-white/80">
            <span className="relative flex h-2 w-2 shrink-0"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-30" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
            <div className="min-w-0 flex-1"><div className="truncate text-base font-semibold text-white/90">{workspace.name} IA</div><div className="mt-0.5 text-sm text-white/40">Agente conectado</div></div>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/[0.08] text-base font-semibold text-white">{user.initials}</div>
            <div className="min-w-0 flex-1"><div className="truncate text-base font-semibold text-white/90">{user.displayName}</div><div className="mt-0.5 text-sm text-white/40">{platformRole ? `Ignite · ${platformRole}` : user.roleLabel}</div></div>
            <button onClick={async () => { await authClient.signOut(); window.location.assign('/login'); }} aria-label="Cerrar sesión" title="Cerrar sesión" className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/35 transition hover:bg-white/[0.07] hover:text-white/80"><LogOut size={13} /></button>
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral/15 bg-white px-5 md:px-7">
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.02em]">{pageMeta.title}</h1>
            <p className="mt-0.5 hidden text-sm text-neutral/60 sm:block">{pageMeta.subtitle}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Popover
              align="right"
              panelClassName="top-11 w-80 max-w-[calc(100vw-2rem)]"
              renderTrigger={({ open, onClick }) => (
                <button
                  type="button"
                  onClick={onClick}
                  aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} mensajes sin leer` : 'Notificaciones'}
                  aria-haspopup="dialog"
                  aria-expanded={open}
                  title="Notificaciones"
                  className={`relative grid h-9 w-9 place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12 ${open ? 'bg-neutral/8 text-neutral' : 'text-neutral/50 hover:bg-neutral/5 hover:text-neutral'}`}
                >
                  <Bell size={17} />
                  {unreadCount > 0 ? <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-label-gold ring-2 ring-white" /> : null}
                </button>
              )}
            >
              {({ close }) => <NotificationTray conversations={conversations} customers={customers} onClose={close} />}
            </Popover>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-white">{user.initials}</div>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}

function getPageMeta(pathname: string, workspaceName: string) {
  if (pathname === '/') return { title: 'Inicio', subtitle: `Resumen operativo de ${workspaceName}` };
  if (pathname === '/conversaciones') return { title: 'Conversaciones', subtitle: 'Gestiona y responde las conversaciones de tus clientes' };
  if (pathname === '/clientes') return { title: 'Clientes', subtitle: 'Consulta y organiza la información de tus clientes' };
  if (pathname === '/usuarios') return { title: 'Usuarios', subtitle: `Administra los accesos del equipo de ${workspaceName}` };
  if (pathname === '/negocios') return { title: 'Negocios', subtitle: 'Administra los backoffices y clientes de Ignite' };
  return { title: '', subtitle: '' };
}

function NotificationTray({ conversations, customers, onClose }: { conversations: ReturnType<typeof useBackofficeState>['conversations']; customers: ReturnType<typeof useBackofficeState>['customers']; onClose: () => void }) {
  const unreadConversations = conversations.filter((conversation) => conversation.unreadCount > 0).slice(0, 6);

  return (
    <div>
      <div className="flex items-start justify-between border-b border-neutral/10 px-4 py-3.5">
        <div>
          <strong className="block text-base font-semibold text-neutral">Notificaciones</strong>
          <span className="mt-1 block text-sm text-neutral/40">{unreadConversations.length > 0 ? `${unreadConversations.length} conversaciones con mensajes nuevos` : 'Todo al día'}</span>
        </div>
        <Bell size={16} className="mt-0.5 text-label-gold" aria-hidden="true" />
      </div>

      {unreadConversations.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-neutral/8 text-neutral/35"><Bell size={17} /></div>
          <p className="mt-3 text-sm font-medium text-neutral/60">No tienes notificaciones nuevas.</p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto p-2">
          {unreadConversations.map((conversation) => {
            const customer = customers.find((item) => item.id === conversation.customerId);
            const lastMessage = conversation.messages.at(-1);
            return (
              <Link key={conversation.id} href="/conversaciones" onClick={onClose} className="flex items-start gap-3 rounded-md px-2.5 py-2.5 transition hover:bg-neutral/5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-label-gold" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-semibold text-neutral">{customer?.name ?? 'Nueva conversación'}</strong>
                  <span className="mt-0.5 block truncate text-sm text-neutral/50">{lastMessage?.content ?? 'Tiene mensajes nuevos.'}</span>
                </span>
                <span className="shrink-0 pt-0.5 text-sm font-semibold text-label-gold">{conversation.unreadCount}</span>
              </Link>
            );
          })}
        </div>
      )}

      <Link href="/conversaciones" onClick={onClose} className="flex items-center justify-center border-t border-neutral/10 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5">
        Ver conversaciones
      </Link>
    </div>
  );
}

function SidebarLink({ href, active, icon, label, badge = 0 }: { href: string; active: boolean; icon: ReactNode; label: string; badge?: number }) {
  return (
    <Link href={href} className={`relative flex h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-base font-medium transition ${active ? 'bg-white/[0.09] text-white' : 'text-white/55 hover:bg-white/[0.05] hover:text-white/90'}`}>
      {active ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-primary" /> : null}
      <span className={active ? 'text-white' : 'text-white/45'}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      <CountBadge count={badge} tone="gold" />
    </Link>
  );
}
