'use client';

import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronRight, Inbox, KeyRound, LogOut, Settings2, ShieldCheck, Tags, Users } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { customers, initialConversationLabels, initialConversations } from '@/lib/mock-data';
import type { Conversation, ConversationLabel, ConversationLabelColor, ConversationStatus, Customer } from '@/types/domain';
import {
  countConversationsByLabel,
  findConversationLabelByName,
  matchesConversationLabels,
  nextConversationLabelColor,
  normalizeConversationLabelName,
} from '@/modules/conversations/domain/conversation-labels';
import { ConversationList, type InboxFilter } from '@/modules/inbox/conversation-list';
import { ConversationLabelDot } from '@/modules/inbox/conversation-labels';
import { ChatPanel } from '@/modules/inbox/chat-panel';
import { LabelManagerDialog } from '@/modules/inbox/label-manager';
import { CustomerDetails } from '@/modules/customers/customer-details';
import { Avatar, SearchInput } from '@/modules/shared/ui';

type View = 'conversations' | 'customers';

export function HarmonyBackoffice({ initialView = 'conversations' }: { initialView?: View }) {
  const router = useRouter();
  const [view, setView] = useState<View>(initialView);
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [labels, setLabels] = useState<ConversationLabel[]>(initialConversationLabels);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState(initialConversations[0].id);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0].id);
  const [draft, setDraft] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedConversationIds, setSelectedConversationIds] = useState<Set<string>>(new Set());
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) ?? conversations[0];
  const selectedCustomer = customers.find((item) => item.id === selectedConversation.customerId) ?? customers[0];

  const labelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const label of labels) counts[label.id] = countConversationsByLabel(conversations, label.id);
    return counts;
  }, [labels, conversations]);

  const filteredConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const customer = customers.find((item) => item.id === conversation.customerId);
      const lastMessage = conversation.messages.at(-1)?.content ?? '';
      const matchesFilter = filter === 'all' || conversation.status === filter;
      const matchesLabel = matchesConversationLabels(conversation, selectedLabelIds);
      const matchesQuery = !normalized
        || customer?.name.toLowerCase().includes(normalized)
        || customer?.phone.includes(normalized)
        || lastMessage.toLowerCase().includes(normalized)
        || conversation.labels.some((label) => label.name.toLowerCase().includes(normalized));
      return matchesFilter && matchesLabel && matchesQuery;
    });
  }, [conversations, filter, selectedLabelIds, query]);

  const filteredCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return customers;
    return customers.filter((customer) => [customer.name, customer.phone, customer.email ?? '', ...customer.tags].some((value) => value.toLowerCase().includes(normalized)));
  }, [query]);

  function navigate(next: View) {
    setView(next);
    setQuery('');
    router.push(next === 'conversations' ? '/conversaciones' : '/clientes');
  }

  function openConversation(conversation: Conversation) {
    setSelectedConversationId(conversation.id);
    setSelectedCustomerId(conversation.customerId);
    setConversations((current) => current.map((item) => item.id === conversation.id ? { ...item, unreadCount: 0 } : item));
  }

  function openCustomer(customer: Customer) {
    setSelectedCustomerId(customer.id);
    const conversation = conversations.find((item) => item.customerId === customer.id);
    if (conversation) setSelectedConversationId(conversation.id);
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    const nextMessage = {
      id: `msg_${Date.now()}`,
      conversationId: selectedConversation.id,
      content,
      direction: 'outgoing' as const,
      senderType: 'agent' as const,
      senderName: 'Atención Harmony',
      createdAt: new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
      status: 'sent' as const,
    };
    setConversations((current) => current.map((conversation) => conversation.id === selectedConversation.id ? { ...conversation, status: 'open', assignedTo: 'Atención Harmony', lastMessageAt: 'Ahora', messages: [...conversation.messages, nextMessage] } : conversation));
    setDraft('');
  }

  function changeStatus(status: ConversationStatus) {
    setConversations((current) => current.map((item) => item.id === selectedConversation.id ? { ...item, status } : item));
  }

  function toggleConversationLabel(labelId: string) {
    const label = labels.find((item) => item.id === labelId);
    if (!label) return;

    setConversations((current) => current.map((conversation) => {
      if (conversation.id !== selectedConversation.id) return conversation;
      const assigned = conversation.labels.some((item) => item.id === labelId);
      return {
        ...conversation,
        labels: assigned ? conversation.labels.filter((item) => item.id !== labelId) : [...conversation.labels, label],
      };
    }));
  }

  function createConversationLabel(name: string) {
    const normalizedName = normalizeConversationLabelName(name);
    if (!normalizedName) return;

    const existing = findConversationLabelByName(labels, normalizedName);
    if (existing) {
      setConversations((current) => current.map((conversation) => {
        if (conversation.id !== selectedConversation.id || conversation.labels.some((item) => item.id === existing.id)) return conversation;
        return { ...conversation, labels: [...conversation.labels, existing] };
      }));
      return;
    }

    const created: ConversationLabel = {
      id: `lbl_${Date.now().toString(36)}`,
      name: normalizedName,
      color: nextConversationLabelColor(labels.length),
    };
    setLabels((current) => [...current, created]);
    setConversations((current) => current.map((conversation) => conversation.id === selectedConversation.id ? { ...conversation, labels: [...conversation.labels, created] } : conversation));
  }

  function toggleLabelFilter(labelId: string) {
    setSelectedLabelIds((current) => current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId]);
  }

  function clearLabelFilter() {
    setSelectedLabelIds([]);
  }

  function toggleSelectionMode() {
    setSelectionMode((current) => {
      if (current) setSelectedConversationIds(new Set());
      return !current;
    });
  }

  function toggleConversationSelection(conversationId: string) {
    setSelectedConversationIds((current) => {
      const next = new Set(current);
      if (next.has(conversationId)) next.delete(conversationId); else next.add(conversationId);
      return next;
    });
  }

  function clearConversationSelection() {
    setSelectedConversationIds(new Set());
  }

  function bulkApplyLabel(labelId: string) {
    const label = labels.find((item) => item.id === labelId);
    if (!label) return;
    setConversations((current) => current.map((conversation) => {
      if (!selectedConversationIds.has(conversation.id) || conversation.labels.some((item) => item.id === labelId)) return conversation;
      return { ...conversation, labels: [...conversation.labels, label] };
    }));
  }

  function bulkRemoveLabel(labelId: string) {
    setConversations((current) => current.map((conversation) => {
      if (!selectedConversationIds.has(conversation.id)) return conversation;
      return { ...conversation, labels: conversation.labels.filter((item) => item.id !== labelId) };
    }));
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

  const pendingCount = conversations.filter((item) => item.status === 'pending').length;
  const unreadCount = conversations.reduce((total, item) => total + item.unreadCount, 0);

  return (
    <main className="flex min-h-screen bg-[#f4f5f2] text-zinc-900">
      <Sidebar
        view={view}
        unreadCount={unreadCount}
        labels={labels}
        labelCounts={labelCounts}
        selectedLabelIds={selectedLabelIds}
        onViewChange={navigate}
        onUsers={() => router.push('/usuarios')}
        onRoles={() => router.push('/roles')}
        onToggleLabelFilter={(labelId) => { if (view !== 'conversations') navigate('conversations'); toggleLabelFilter(labelId); }}
        onManageLabels={() => setLabelManagerOpen(true)}
      />
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/95 px-5 backdrop-blur md:px-7">
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.03em] md:text-2xl">{view === 'conversations' ? 'Conversaciones' : 'Clientes'}</h1>
            <p className="mt-1 hidden text-[11px] text-zinc-500 sm:block">{view === 'conversations' ? 'Gestiona y responde las conversaciones de tus clientes' : 'Consulta y organiza la información de tus clientes'}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="hidden h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-[11px] font-medium text-zinc-600 shadow-sm sm:flex"><Bell size={15} /><span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">{pendingCount} pendientes</span></button>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-harmony-700 text-[11px] font-semibold text-white shadow-sm">FH</div>
          </div>
        </header>

        {view === 'conversations' ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 xl:grid-cols-[330px_minmax(520px,1fr)_300px] 2xl:grid-cols-[360px_minmax(620px,1fr)_320px]">
            <ConversationList
              conversations={filteredConversations}
              customers={customers}
              labels={labels}
              labelCounts={labelCounts}
              selectedId={selectedConversationId}
              query={query}
              filter={filter}
              selectedLabelIds={selectedLabelIds}
              onQueryChange={setQuery}
              onFilterChange={setFilter}
              onToggleLabelFilter={toggleLabelFilter}
              onClearLabelFilter={clearLabelFilter}
              onSelect={openConversation}
              selectionMode={selectionMode}
              selectedConversationIds={selectedConversationIds}
              onToggleSelectionMode={toggleSelectionMode}
              onToggleConversationSelection={toggleConversationSelection}
              onClearConversationSelection={clearConversationSelection}
              onBulkApplyLabel={bulkApplyLabel}
              onBulkRemoveLabel={bulkRemoveLabel}
            />
            <ChatPanel conversation={selectedConversation} customer={selectedCustomer} labels={labels} draft={draft} onDraftChange={setDraft} onSend={sendMessage} onStatusChange={changeStatus} onToggleLabel={toggleConversationLabel} onCreateLabel={createConversationLabel} />
            <CustomerDetails customer={selectedCustomer} conversation={selectedConversation} onOpenCustomers={() => navigate('customers')} />
          </div>
        ) : (
          <CustomersView customers={filteredCustomers} selectedCustomerId={selectedCustomerId} conversations={conversations} query={query} onQueryChange={setQuery} onSelect={openCustomer} />
        )}
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

function Sidebar({ view, unreadCount, labels, labelCounts, selectedLabelIds, onViewChange, onUsers, onRoles, onToggleLabelFilter, onManageLabels }: {
  view: View;
  unreadCount: number;
  labels: ConversationLabel[];
  labelCounts: Record<string, number>;
  selectedLabelIds: string[];
  onViewChange: (view: View) => void;
  onUsers: () => void;
  onRoles: () => void;
  onToggleLabelFilter: (labelId: string) => void;
  onManageLabels: () => void;
}) {
  return (
    <aside className="hidden min-h-screen w-[220px] shrink-0 flex-col border-r border-white/[0.07] bg-harmony-900 text-white lg:flex">
      <div className="flex h-[72px] items-center gap-3 border-b border-white/[0.07] px-4">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold-500 text-xs font-bold text-harmony-900 shadow-sm shadow-black/10">H</div>
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold tracking-[-0.02em]">Harmony</div>
          <div className="mt-0.5 text-[9px] text-white/45">Backoffice</div>
        </div>
      </div>

      <nav className="px-2.5 py-4" aria-label="Principal">
        <div className="mb-2 px-2.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-white/30">Principal</div>
        <div className="space-y-1">
          <SidebarButton active={view === 'conversations'} icon={<Inbox size={17} />} label="Conversaciones" badge={unreadCount || undefined} onClick={() => onViewChange('conversations')} />
          <SidebarButton active={view === 'customers'} icon={<Users size={17} />} label="Clientes" onClick={() => onViewChange('customers')} />
          <SidebarButton active={false} icon={<ShieldCheck size={17} />} label="Usuarios" onClick={onUsers} />
          <SidebarButton active={false} icon={<KeyRound size={17} />} label="Roles y permisos" onClick={onRoles} />
        </div>
      </nav>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-1" aria-label="Etiquetas">
        <div className="mb-2 flex items-center justify-between px-2.5">
          <span className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-white/30"><Tags size={11} /> Etiquetas</span>
          <button type="button" onClick={onManageLabels} aria-label="Gestionar etiquetas" title="Gestionar etiquetas" className="grid h-6 w-6 place-items-center rounded-lg text-white/35 transition hover:bg-white/[0.07] hover:text-white/80"><Settings2 size={13} /></button>
        </div>
        <div className="space-y-0.5">
          {labels.length === 0 ? (
            <p className="px-2.5 py-2 text-[8px] text-white/30">Sin etiquetas todavía.</p>
          ) : labels.map((label) => {
            const active = selectedLabelIds.includes(label.id);
            return (
              <button key={label.id} onClick={() => onToggleLabelFilter(label.id)} className={`flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[10px] font-medium transition ${active ? 'bg-white/[0.09] text-white' : 'text-white/55 hover:bg-white/[0.05] hover:text-white/90'}`}>
                <ConversationLabelDot color={label.color} />
                <span className="min-w-0 flex-1 truncate">{label.name}</span>
                <span className="shrink-0 text-[8px] text-white/35">{labelCounts[label.id] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto border-t border-white/[0.07] px-2.5 pb-2.5 pt-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-white/80">
          <span className="relative flex h-2 w-2 shrink-0"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
          <div className="min-w-0 flex-1"><div className="truncate text-[10px] font-semibold text-white/90">Harmony IA</div><div className="mt-0.5 text-[8px] text-white/40">Agente conectado</div></div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.035] px-2.5 py-2.5"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.08] text-[9px] font-semibold text-white">FH</div><div className="min-w-0 flex-1"><div className="truncate text-[10px] font-semibold text-white/90">Felipe</div><div className="mt-0.5 text-[8px] text-white/40">Administrador</div></div><button onClick={async () => { await authClient.signOut(); window.location.assign('/login'); }} aria-label="Cerrar sesión" title="Cerrar sesión" className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white/35 transition hover:bg-white/[0.07] hover:text-white/80"><LogOut size={13} /></button></div>
      </div>
    </aside>
  );
}

function SidebarButton({ active, icon, label, badge, onClick }: { active: boolean; icon: ReactNode; label: string; badge?: number; onClick: () => void }) {
  return <button onClick={onClick} className={`relative flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[11px] font-medium transition ${active ? 'bg-white/[0.09] text-white' : 'text-white/55 hover:bg-white/[0.05] hover:text-white/90'}`}>{active ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-gold-400" /> : null}<span className={active ? 'text-gold-300' : 'text-white/45'}>{icon}</span><span className="flex-1 truncate">{label}</span>{badge ? <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold-500 px-1.5 text-[7px] font-bold text-harmony-950">{badge}</span> : null}</button>;
}

function CustomersView({ customers: rows, selectedCustomerId, conversations, query, onQueryChange, onSelect }: { customers: Customer[]; selectedCustomerId: string; conversations: Conversation[]; query: string; onQueryChange: (value: string) => void; onSelect: (customer: Customer) => void }) {
  const selected = customers.find((item) => item.id === selectedCustomerId) ?? customers[0];
  return <div className="min-h-0 flex-1 overflow-auto p-3 md:p-5"><div className="mb-4 flex items-center justify-between gap-3"><div className="w-full max-w-xl"><SearchInput value={query} onChange={onQueryChange} placeholder="Buscar por nombre, teléfono, correo o etiqueta..." /></div><span className="hidden text-[10px] text-zinc-400 sm:block">{rows.length} clientes</span></div><div className="grid gap-3 xl:grid-cols-[minmax(680px,1fr)_320px]"><section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_10px_35px_rgba(24,60,43,0.05)]"><div className="grid grid-cols-[1.1fr_1fr_1fr_.7fr_24px] gap-4 border-b border-zinc-100 bg-zinc-50/70 px-5 py-3 text-[9px] font-medium text-zinc-400"><span>Cliente</span><span>Contacto</span><span>Etiquetas</span><span>Actividad</span><span /></div>{rows.map((customer) => <button key={customer.id} onClick={() => onSelect(customer)} className={`grid w-full grid-cols-[1.1fr_1fr_1fr_.7fr_24px] items-center gap-4 border-b border-zinc-100 px-5 py-4 text-left transition last:border-b-0 ${selectedCustomerId === customer.id ? 'bg-harmony-50/60' : 'hover:bg-zinc-50/70'}`}><span className="flex items-center gap-3"><Avatar name={customer.name} /><strong className="truncate text-[11px]">{customer.name}</strong></span><span className="min-w-0 text-[9px] text-zinc-500"><span className="block truncate">{customer.phone}</span><span className="mt-1 block truncate text-zinc-400">{customer.email ?? 'Sin correo'}</span></span><span className="flex flex-wrap gap-1">{customer.tags.slice(0, 2).map((tag) => <em key={tag} className="rounded-full bg-gold-50 px-2 py-1 text-[8px] not-italic text-gold-700">{tag}</em>)}</span><span className="text-[9px] text-zinc-400">{customer.lastSeen}</span><ChevronRight size={16} className="text-zinc-300" /></button>)}</section><CustomerDetails customer={selected} conversation={conversations.find((item) => item.customerId === selected.id)} compact /></div></div>;
}
