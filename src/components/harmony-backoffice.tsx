'use client';

import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { Bell, ChevronDown, ChevronRight, Inbox, Users } from 'lucide-react';
import { customers, initialConversations } from '@/lib/mock-data';
import type { Conversation, ConversationStatus, Customer } from '@/types/domain';
import { ConversationList, type InboxFilter } from '@/modules/inbox/conversation-list';
import { ChatPanel } from '@/modules/inbox/chat-panel';
import { CustomerDetails } from '@/modules/customers/customer-details';
import { Avatar, SearchInput } from '@/modules/shared/ui';

type View = 'conversations' | 'customers';

export function HarmonyBackoffice() {
  const [view, setView] = useState<View>('conversations');
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState(initialConversations[0].id);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0].id);
  const [draft, setDraft] = useState('');

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) ?? conversations[0];
  const selectedCustomer = customers.find((item) => item.id === selectedConversation.customerId) ?? customers[0];

  const filteredConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const customer = customers.find((item) => item.id === conversation.customerId);
      const lastMessage = conversation.messages.at(-1)?.content ?? '';
      const matchesFilter = filter === 'all' || conversation.status === filter;
      const matchesQuery = !normalized || customer?.name.toLowerCase().includes(normalized) || customer?.phone.includes(normalized) || lastMessage.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [conversations, filter, query]);

  const filteredCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return customers;
    return customers.filter((customer) => [customer.name, customer.phone, customer.email ?? '', ...customer.tags].some((value) => value.toLowerCase().includes(normalized)));
  }, [query]);

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

  const pendingCount = conversations.filter((item) => item.status === 'pending').length;
  const unreadCount = conversations.reduce((total, item) => total + item.unreadCount, 0);

  return (
    <main className="flex min-h-screen bg-[#f4f5f2] text-zinc-900">
      <Sidebar view={view} unreadCount={unreadCount} onViewChange={(next) => { setView(next); setQuery(''); }} />
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/95 px-5 backdrop-blur md:px-7">
          <div><h1 className="text-xl font-semibold tracking-[-0.03em] md:text-2xl">{view === 'conversations' ? 'Conversaciones' : 'Clientes'}</h1><p className="mt-1 hidden text-[11px] text-zinc-500 sm:block">{view === 'conversations' ? 'Gestiona y responde las conversaciones de tus clientes' : 'Consulta y organiza la información de tus clientes'}</p></div>
          <div className="flex items-center gap-2.5"><button className="hidden h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-[11px] font-medium text-zinc-600 shadow-sm sm:flex"><Bell size={15} /><span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">{pendingCount} pendientes</span></button><div className="grid h-10 w-10 place-items-center rounded-full bg-harmony-700 text-[11px] font-semibold text-white shadow-sm">FH</div></div>
        </header>
        {view === 'conversations' ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 xl:grid-cols-[330px_minmax(520px,1fr)_300px] 2xl:grid-cols-[360px_minmax(620px,1fr)_320px]">
            <ConversationList conversations={filteredConversations} customers={customers} selectedId={selectedConversationId} query={query} filter={filter} onQueryChange={setQuery} onFilterChange={setFilter} onSelect={openConversation} />
            <ChatPanel conversation={selectedConversation} customer={selectedCustomer} draft={draft} onDraftChange={setDraft} onSend={sendMessage} onStatusChange={changeStatus} />
            <CustomerDetails customer={selectedCustomer} conversation={selectedConversation} onOpenCustomers={() => setView('customers')} />
          </div>
        ) : <CustomersView customers={filteredCustomers} selectedCustomerId={selectedCustomerId} conversations={conversations} query={query} onQueryChange={setQuery} onSelect={openCustomer} />}
      </section>
    </main>
  );
}

function Sidebar({ view, unreadCount, onViewChange }: { view: View; unreadCount: number; onViewChange: (view: View) => void }) {
  return <aside className="hidden min-h-screen w-[236px] shrink-0 flex-col bg-gradient-to-b from-harmony-900 via-[#183c2b] to-[#153625] text-white lg:flex">
    <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-gold-500 text-sm font-bold text-harmony-900">H</div><div><div className="text-[15px] font-semibold">Harmony</div><div className="mt-0.5 text-[10px] text-white/50">Backoffice</div></div></div>
    <nav className="space-y-1.5 px-3 py-5" aria-label="Principal"><SidebarButton active={view === 'conversations'} icon={<Inbox size={18} />} label="Conversaciones" badge={unreadCount || undefined} onClick={() => onViewChange('conversations')} /><SidebarButton active={view === 'customers'} icon={<Users size={18} />} label="Clientes" onClick={() => onViewChange('customers')} /></nav>
    <div className="mt-auto p-3"><div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><div><div className="text-xs font-semibold">Harmony IA</div><div className="mt-0.5 text-[10px] text-white/50">Agente conectado</div></div></div><div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3"><Metric label="Resueltas hoy" value="12" /><Metric label="Tiempo respuesta" value="2m 15s" /></div></div><div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-[11px] font-semibold">FH</div><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-semibold">Felipe</div><div className="text-[9px] text-white/45">Administrador</div></div><ChevronDown size={14} className="text-white/45" /></div></div>
  </aside>;
}

function SidebarButton({ active, icon, label, badge, onClick }: { active: boolean; icon: ReactNode; label: string; badge?: number; onClick: () => void }) { return <button onClick={onClick} className={`flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[12px] font-medium transition ${active ? 'bg-white/10 text-white ring-1 ring-inset ring-white/10' : 'text-white/60 hover:bg-white/[0.06] hover:text-white'}`}><span className={active ? 'text-gold-300' : ''}>{icon}</span><span className="flex-1">{label}</span>{badge ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold-500 px-1.5 text-[8px] font-bold text-harmony-900">{badge}</span> : null}</button>; }
function Metric({ label, value }: { label: string; value: string }) { return <div><div className="text-[9px] text-white/45">{label}</div><div className="mt-1 text-base font-semibold">{value}</div></div>; }

function CustomersView({ customers: rows, selectedCustomerId, conversations, query, onQueryChange, onSelect }: { customers: Customer[]; selectedCustomerId: string; conversations: Conversation[]; query: string; onQueryChange: (value: string) => void; onSelect: (customer: Customer) => void }) {
  const selected = customers.find((item) => item.id === selectedCustomerId) ?? customers[0];
  return <div className="min-h-0 flex-1 overflow-auto p-3 md:p-5"><div className="mb-4 flex items-center justify-between gap-3"><div className="w-full max-w-xl"><SearchInput value={query} onChange={onQueryChange} placeholder="Buscar por nombre, teléfono, correo o etiqueta..." /></div><span className="hidden text-[10px] text-zinc-400 sm:block">{rows.length} clientes</span></div><div className="grid gap-3 xl:grid-cols-[minmax(680px,1fr)_320px]"><section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_10px_35px_rgba(24,60,43,0.05)]"><div className="grid grid-cols-[1.1fr_1fr_1fr_.7fr_24px] gap-4 border-b border-zinc-100 bg-zinc-50/70 px-5 py-3 text-[9px] font-medium text-zinc-400"><span>Cliente</span><span>Contacto</span><span>Etiquetas</span><span>Actividad</span><span /></div>{rows.map((customer) => <button key={customer.id} onClick={() => onSelect(customer)} className={`grid w-full grid-cols-[1.1fr_1fr_1fr_.7fr_24px] items-center gap-4 border-b border-zinc-100 px-5 py-4 text-left transition last:border-b-0 ${selectedCustomerId === customer.id ? 'bg-harmony-50/60' : 'hover:bg-zinc-50/70'}`}><span className="flex items-center gap-3"><Avatar name={customer.name} /><strong className="truncate text-[11px]">{customer.name}</strong></span><span className="min-w-0 text-[9px] text-zinc-500"><span className="block truncate">{customer.phone}</span><span className="mt-1 block truncate text-zinc-400">{customer.email ?? 'Sin correo'}</span></span><span className="flex flex-wrap gap-1">{customer.tags.slice(0,2).map((tag) => <em key={tag} className="rounded-full bg-gold-50 px-2 py-1 text-[8px] not-italic text-gold-700">{tag}</em>)}</span><span className="text-[9px] text-zinc-400">{customer.lastSeen}</span><ChevronRight size={16} className="text-zinc-300" /></button>)}</section><CustomerDetails customer={selected} conversation={conversations.find((item) => item.customerId === selected.id)} compact /></div></div>;
}
