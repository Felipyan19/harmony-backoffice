'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { Bell, Inbox, LogOut, Settings2, ShieldCheck, Tags, Users } from 'lucide-react';
import { BrandIcon } from '@/components/brand-icon';
import { authClient } from '@/lib/auth/client';
import { ConversationLabelDot } from '@/modules/inbox/conversation-labels';
import { LabelManagerDialog } from '@/modules/inbox/label-manager';
import type { ConversationLabel, ConversationLabelColor } from '@/types/domain';
import {
  findConversationLabelByName,
  nextConversationLabelColor,
  normalizeConversationLabelName,
} from '@/modules/conversations/domain/conversation-labels';
import { useBackofficeState } from './backoffice-context';

const NAV_ITEMS = [
  { href: '/conversaciones', label: 'Conversaciones', icon: Inbox, withUnreadBadge: true },
  { href: '/clientes', label: 'Clientes', icon: Users, withUnreadBadge: false },
  { href: '/usuarios', label: 'Usuarios', icon: ShieldCheck, withUnreadBadge: false },
] as const;

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/conversaciones': { title: 'Conversaciones', subtitle: 'Gestiona y responde las conversaciones de tus clientes' },
  '/clientes': { title: 'Clientes', subtitle: 'Consulta y organiza la información de tus clientes' },
  '/usuarios': { title: 'Usuarios', subtitle: 'Administra accesos, perfiles y roles del equipo Harmony.' },
};

type ShellUser = { displayName: string; roleLabel: string; initials: string };

export function BackofficeShell({ children, user }: { children: ReactNode; user: ShellUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);
  const {
    setConversations,
    labels, setLabels,
    selectedLabelIds, setSelectedLabelIds,
    toggleLabelFilter,
    labelCounts, unreadCount, pendingCount,
  } = useBackofficeState();

  function handleToggleLabelFilter(labelId: string) {
    if (pathname !== '/conversaciones') router.push('/conversaciones');
    toggleLabelFilter(labelId);
  }

  function createLabelGlobally(name: string) {
    const normalizedName = normalizeConversationLabelName(name);
    if (!normalizedName || findConversationLabelByName(labels, normalizedName)) return;
    const created: ConversationLabel = { id: `lbl_${Date.now().toString(36)}`, name: normalizedName, color: nextConversationLabelColor(labels.length) };
    setLabels((current) => [...current, created]);
  }

  function renameLabel(labelId: string, name: string) {
    setLabels((current) => current.map((label) => label.id === labelId ? { ...label, name } : label));
    setConversations((current) => current.map((conversation) => ({
      ...conversation,
      labels: conversation.labels.map((label) => label.id === labelId ? { ...label, name } : label),
    })));
  }

  function recolorLabel(labelId: string, color: ConversationLabelColor) {
    setLabels((current) => current.map((label) => label.id === labelId ? { ...label, color } : label));
    setConversations((current) => current.map((conversation) => ({
      ...conversation,
      labels: conversation.labels.map((label) => label.id === labelId ? { ...label, color } : label),
    })));
  }

  function deleteLabel(labelId: string) {
    setLabels((current) => current.filter((label) => label.id !== labelId));
    setConversations((current) => current.map((conversation) => ({
      ...conversation,
      labels: conversation.labels.filter((label) => label.id !== labelId),
    })));
    setSelectedLabelIds((current) => current.filter((id) => id !== labelId));
  }

  const pageMeta = PAGE_META[pathname] ?? { title: '', subtitle: '' };

  return (
    <main className="flex h-screen overflow-hidden bg-[#f3f2ee] text-neutral">
      <aside className="hidden h-screen w-[220px] shrink-0 flex-col border-r border-white/[0.07] bg-neutral text-white lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.07] px-4">
          <BrandIcon size={36} className="shrink-0 rounded-md" />
          <div className="min-w-0">
            <div className="truncate text-base font-semibold tracking-[-0.02em]">Harmony</div>
            <div className="mt-0.5 text-sm text-white/45">Backoffice</div>
          </div>
        </div>

        <nav className="px-2.5 py-4" aria-label="Principal">
          <div className="mb-2 px-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-white/30">Principal</div>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                active={pathname === item.href}
                icon={<item.icon size={17} />}
                label={item.label}
                badge={item.withUnreadBadge ? unreadCount || undefined : undefined}
              />
            ))}
          </div>
        </nav>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-1" aria-label="Etiquetas">
          <div className="mb-2 flex items-center justify-between px-2.5">
            <span className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.16em] text-white/30"><Tags size={11} /> Etiquetas</span>
            <button type="button" onClick={() => setLabelManagerOpen(true)} aria-label="Gestionar etiquetas" title="Gestionar etiquetas" className="grid h-6 w-6 place-items-center rounded-lg text-white/35 transition hover:bg-white/[0.07] hover:text-white/80"><Settings2 size={13} /></button>
          </div>
          <div className="space-y-0.5">
            {labels.length === 0 ? (
              <p className="px-2.5 py-2 text-sm text-white/30">Sin etiquetas todavía.</p>
            ) : labels.map((label) => {
              const active = selectedLabelIds.includes(label.id);
              return (
                <button key={label.id} onClick={() => handleToggleLabelFilter(label.id)} className={`flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm font-medium transition ${active ? 'bg-white/[0.09] text-white' : 'text-white/55 hover:bg-white/[0.05] hover:text-white/90'}`}>
                  <ConversationLabelDot color={label.color} />
                  <span className="min-w-0 flex-1 truncate">{label.name}</span>
                  <span className="shrink-0 text-sm text-white/35">{labelCounts[label.id] ?? 0}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto border-t border-white/[0.07] px-2.5 pb-2.5 pt-3">
          <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-white/80">
            <span className="relative flex h-2 w-2 shrink-0"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-30" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-white/90">Harmony IA</div><div className="mt-0.5 text-sm text-white/40">Agente conectado</div></div>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/[0.08] text-sm font-semibold text-white">{user.initials}</div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-white/90">{user.displayName}</div><div className="mt-0.5 text-sm text-white/40">{user.roleLabel}</div></div>
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
            <button className="hidden h-9 items-center gap-2 rounded-md border border-neutral/15 bg-white px-3 text-sm font-medium text-neutral/70 sm:flex"><Bell size={15} /><span className="rounded-full bg-warning/10 px-2 py-0.5 text-warning">{pendingCount} pendientes</span></button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-white">{user.initials}</div>
          </div>
        </header>

        {children}
      </section>

      {labelManagerOpen ? (
        <LabelManagerDialog
          labels={labels}
          counts={labelCounts}
          onClose={() => setLabelManagerOpen(false)}
          onRename={renameLabel}
          onRecolor={recolorLabel}
          onDelete={deleteLabel}
          onCreate={createLabelGlobally}
        />
      ) : null}
    </main>
  );
}

function SidebarLink({ href, active, icon, label, badge }: { href: string; active: boolean; icon: ReactNode; label: string; badge?: number }) {
  return (
    <Link href={href} className={`relative flex h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm font-medium transition ${active ? 'bg-white/[0.09] text-white' : 'text-white/55 hover:bg-white/[0.05] hover:text-white/90'}`}>
      {active ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-primary" /> : null}
      <span className={active ? 'text-white' : 'text-white/45'}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge ? <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1.5 text-sm font-bold text-white">{badge}</span> : null}
    </Link>
  );
}
