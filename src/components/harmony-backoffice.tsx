'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Inbox,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';
import { customers, initialConversations } from '@/lib/mock-data';
import type { Conversation, ConversationStatus, Customer } from '@/types/domain';

type View = 'conversations' | 'customers';
type Filter = 'all' | ConversationStatus;

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const statusLabel: Record<ConversationStatus, string> = {
  open: 'Abierta',
  pending: 'Pendiente',
  resolved: 'Resuelta',
};

const statusClass: Record<ConversationStatus, string> = {
  open: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  resolved: 'bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200',
};

const filterLabel: Record<Filter, string> = {
  all: 'Todas',
  pending: 'Pendientes',
  open: 'Abiertas',
  resolved: 'Resueltas',
};

export function HarmonyBackoffice() {
  const [view, setView] = useState<View>('conversations');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState(initialConversations[0].id);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0].id);
  const [draft, setDraft] = useState('');

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) ?? conversations[0];
  const selectedCustomer = customers.find((item) => item.id === selectedConversation?.customerId) ?? customers[0];

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const customer = customers.find((item) => item.id === conversation.customerId);
      const lastMessage = conversation.messages.at(-1)?.content ?? '';
      const matchesFilter = filter === 'all' || conversation.status === filter;
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        customer?.name.toLowerCase().includes(normalizedQuery) ||
        customer?.phone.includes(normalizedQuery) ||
        lastMessage.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [conversations, filter, query]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.email ?? '', ...customer.tags].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [query]);

  function openConversation(conversation: Conversation) {
    setSelectedConversationId(conversation.id);
    setSelectedCustomerId(conversation.customerId);
    setConversations((current) =>
      current.map((item) => (item.id === conversation.id ? { ...item, unreadCount: 0 } : item))
    );
  }

  function openCustomer(customer: Customer) {
    setSelectedCustomerId(customer.id);
    const conversation = conversations.find((item) => item.customerId === customer.id);
    if (conversation) setSelectedConversationId(conversation.id);
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !selectedConversation) return;

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

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversation.id
          ? {
              ...conversation,
              status: 'open',
              assignedTo: 'Atención Harmony',
              lastMessageAt: 'Ahora',
              messages: [...conversation.messages, nextMessage],
            }
          : conversation
      )
    );
    setDraft('');
  }

  function changeStatus(status: ConversationStatus) {
    if (!selectedConversation) return;
    setConversations((current) =>
      current.map((item) => (item.id === selectedConversation.id ? { ...item, status } : item))
    );
  }

  const pendingCount = conversations.filter((item) => item.status === 'pending').length;
  const unreadCount = conversations.reduce((total, item) => total + item.unreadCount, 0);

  return (
    <main className="flex min-h-screen bg-[#f4f5f2] text-zinc-900">
      <aside className="hidden min-h-screen w-[236px] shrink-0 flex-col bg-gradient-to-b from-harmony-900 via-[#183c2b] to-[#153625] text-white lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gold-500 text-sm font-bold text-harmony-900 shadow-lg shadow-black/10">H</div>
          <div>
            <div className="text-[15px] font-semibold tracking-[-0.01em]">Harmony</div>
            <div className="mt-0.5 text-[10px] text-white/50">Backoffice</div>
          </div>
        </div>

        <nav className="space-y-1.5 px-3 py-5" aria-label="Principal">
          <SidebarButton
            active={view === 'conversations'}
            icon={<Inbox size={18} />}
            label="Conversaciones"
            badge={unreadCount || undefined}
            onClick={() => setView('conversations')}
          />
          <SidebarButton
            active={view === 'customers'}
            icon={<Users size={18} />}
            label="Clientes"
            onClick={() => setView('customers')}
          />
        </nav>

        <div className="mt-auto p-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-inner shadow-white/[0.02]">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <div>
                <div className="text-xs font-semibold">Harmony IA</div>
                <div className="mt-0.5 text-[10px] text-white/50">Agente conectado</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
              <div>
                <div className="text-[9px] text-white/45">Resueltas hoy</div>
                <div className="mt-1 text-base font-semibold">12</div>
              </div>
              <div>
                <div className="text-[9px] text-white/45">Tiempo respuesta</div>
                <div className="mt-1 text-base font-semibold">2m 15s</div>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-[11px] font-semibold">FH</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold">Felipe</div>
              <div className="text-[9px] text-white/45">Administrador</div>
            </div>
            <ChevronDown size={14} className="text-white/45" />
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/95 px-5 backdrop-blur md:px-7">
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.03em] md:text-2xl">
              {view === 'conversations' ? 'Conversaciones' : 'Clientes'}
            </h1>
            <p className="mt-1 hidden text-[11px] text-zinc-500 sm:block">
              {view === 'conversations'
                ? 'Gestiona y responde las conversaciones de tus clientes'
                : 'Consulta y organiza la información de tus clientes'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button className="hidden h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-[11px] font-medium text-zinc-600 shadow-sm transition hover:bg-zinc-50 sm:flex">
              <Bell size={15} />
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">{pendingCount} pendientes</span>
            </button>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-harmony-700 text-[11px] font-semibold text-white shadow-sm">FH</div>
          </div>
        </header>

        {view === 'conversations' ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 xl:grid-cols-[330px_minmax(520px,1fr)_300px] 2xl:grid-cols-[360px_minmax(620px,1fr)_320px]">
            <section className="flex min-h-[540px] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_10px_35px_rgba(24,60,43,0.05)] xl:min-h-0">
              <div className="border-b border-zinc-100 p-3.5">
                <label className="flex h-11 items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3.5 text-zinc-400 transition focus-within:border-harmony-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-harmony-100/70">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar cliente o mensaje..."
                    className="min-w-0 flex-1 bg-transparent text-[12px] text-zinc-800 outline-none placeholder:text-zinc-400"
                  />
                </label>

                <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-zinc-100/80 p-1">
                  {(['all', 'open', 'pending', 'resolved'] as Filter[]).map((item) => (
                    <button
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`rounded-lg px-2 py-2 text-[9px] font-medium transition ${
                        filter === item
                          ? 'bg-white text-harmony-800 shadow-sm ring-1 ring-zinc-200/70'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      {filterLabel[item]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {filteredConversations.map((conversation) => {
                  const customer = customers.find((item) => item.id === conversation.customerId)!;
                  const lastMessage = conversation.messages.at(-1);
                  const selected = conversation.id === selectedConversationId;

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => openConversation(conversation)}
                      className={`relative flex w-full gap-3 border-b border-zinc-100 px-4 py-4 text-left transition ${
                        selected
                          ? 'bg-gradient-to-r from-harmony-50 to-white before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-harmony-700'
                          : 'bg-white hover:bg-zinc-50/70'
                      }`}
                    >
                      <Avatar name={customer.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <strong className="truncate text-[12px] font-semibold text-zinc-900">{customer.name}</strong>
                          <span className="shrink-0 text-[9px] text-zinc-400">{conversation.lastMessageAt}</span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-zinc-500">{lastMessage?.content}</p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${statusClass[conversation.status]}`}>
                            {statusLabel[conversation.status]}
                          </span>
                          <span className="text-[8px] text-zinc-400">WhatsApp</span>
                        </div>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="absolute bottom-4 right-4 grid h-5 min-w-5 place-items-center rounded-full bg-gold-500 px-1.5 text-[8px] font-bold text-harmony-900 shadow-sm">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_10px_35px_rgba(24,60,43,0.05)] xl:min-h-0">
              <header className="flex h-[74px] shrink-0 items-center justify-between gap-3 border-b border-zinc-100 px-4 md:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={selectedCustomer.name} size="lg" />
                  <div className="min-w-0">
                    <strong className="block truncate text-[13px] font-semibold">{selectedCustomer.name}</strong>
                    <span className="mt-1 block truncate text-[9px] text-zinc-400">{selectedCustomer.phone} · WhatsApp</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedConversation.status}
                    onChange={(event) => changeStatus(event.target.value as ConversationStatus)}
                    aria-label="Estado de conversación"
                    className="h-9 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[10px] font-medium text-zinc-700 outline-none transition focus:border-harmony-300 focus:ring-4 focus:ring-harmony-100"
                  >
                    <option value="open">Abierta</option>
                    <option value="pending">Pendiente</option>
                    <option value="resolved">Resuelta</option>
                  </select>
                  <button className="grid h-9 w-9 place-items-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" aria-label="Más opciones">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </header>

              <div className="relative flex-1 overflow-y-auto bg-[#fafaf7] px-4 py-5 md:px-6">
                <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#d8ded9_0.8px,transparent_0.8px)] [background-size:18px_18px]" />
                <div className="relative mx-auto max-w-4xl">
                  <div className="mb-5 flex justify-center">
                    <span className="rounded-full bg-white px-3 py-1 text-[9px] font-medium text-zinc-400 shadow-sm ring-1 ring-zinc-200/70">Hoy</span>
                  </div>

                  {selectedConversation.messages.map((message) => {
                    const outgoing = message.direction === 'outgoing';
                    const bot = message.senderType === 'bot';
                    return (
                      <div key={message.id} className={`mb-3 flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-[0_6px_18px_rgba(24,60,43,0.05)] ring-1 ring-inset md:max-w-[70%] ${
                            outgoing
                              ? bot
                                ? 'rounded-br-md bg-harmony-100/80 text-harmony-900 ring-harmony-200'
                                : 'rounded-br-md bg-harmony-700 text-white ring-harmony-700'
                              : 'rounded-bl-md bg-white text-zinc-800 ring-zinc-200'
                          }`}
                        >
                          {message.senderType !== 'customer' && (
                            <div className={`mb-1.5 text-[9px] font-semibold ${outgoing && !bot ? 'text-white/70' : 'text-harmony-700'}`}>
                              {bot ? 'Harmony IA' : message.senderName}
                            </div>
                          )}
                          <p className="m-0 text-[11px] leading-[1.65]">{message.content}</p>
                          <div className={`mt-1.5 flex items-center justify-end gap-1 text-[8px] ${outgoing && !bot ? 'text-white/60' : 'text-zinc-400'}`}>
                            <span>{message.createdAt}</span>
                            {outgoing && <CheckCheck size={13} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={sendMessage} className="shrink-0 border-t border-zinc-100 bg-white p-3.5">
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/60 transition focus-within:border-harmony-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-harmony-100/60">
                  <div className="flex items-center gap-5 border-b border-zinc-100 px-4 py-2.5 text-[9px] font-medium text-zinc-500">
                    <span className="flex items-center gap-1.5 border-b-2 border-harmony-700 pb-2 text-harmony-700">
                      <MessageCircle size={13} /> Responder
                    </span>
                    <span className="flex items-center gap-1.5 pb-2">
                      <Sparkles size={13} /> Atención Harmony
                    </span>
                  </div>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Escribe un mensaje..."
                    rows={3}
                    className="min-h-20 w-full resize-none bg-transparent px-4 py-3 text-[11px] leading-5 text-zinc-800 outline-none placeholder:text-zinc-400"
                  />
                  <div className="flex items-center justify-between px-3 pb-3">
                    <button type="button" className="grid h-9 w-9 place-items-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" aria-label="Adjuntar archivo">
                      <Paperclip size={16} />
                    </button>
                    <button
                      type="submit"
                      className="flex h-9 items-center gap-2 rounded-xl bg-harmony-700 px-4 text-[10px] font-semibold text-white shadow-sm shadow-harmony-900/10 transition hover:bg-harmony-800 active:scale-[0.98]"
                    >
                      <Send size={14} /> Enviar
                    </button>
                  </div>
                </div>
              </form>
            </section>

            <CustomerDetails
              customer={selectedCustomer}
              conversation={selectedConversation}
              onOpenCustomers={() => setView('customers')}
            />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto p-3 md:p-5">
            <div className="mx-auto max-w-7xl">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex h-11 w-full max-w-xl items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-zinc-400 shadow-sm transition focus-within:border-harmony-300 focus-within:ring-4 focus-within:ring-harmony-100/70">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar por nombre, teléfono, correo o etiqueta..."
                    className="min-w-0 flex-1 bg-transparent text-[12px] text-zinc-800 outline-none placeholder:text-zinc-400"
                  />
                </label>
                <span className="text-[11px] font-medium text-zinc-400">{filteredCustomers.length} clientes</span>
              </div>

              <div className="grid gap-3 xl:grid-cols-[minmax(680px,1fr)_320px]">
                <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_10px_35px_rgba(24,60,43,0.05)]">
                  <div className="grid grid-cols-[1.2fr_1.2fr_1.2fr_.8fr_24px] gap-4 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    <span>Cliente</span><span>Contacto</span><span>Etiquetas</span><span>Actividad</span><span />
                  </div>
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => openCustomer(customer)}
                      className={`grid w-full grid-cols-[1.2fr_1.2fr_1.2fr_.8fr_24px] items-center gap-4 border-b border-zinc-100 px-4 py-4 text-left transition last:border-0 ${
                        selectedCustomerId === customer.id ? 'bg-harmony-50/70' : 'hover:bg-zinc-50/70'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={customer.name} />
                        <strong className="truncate text-[11px] font-semibold">{customer.name}</strong>
                      </span>
                      <span className="min-w-0 text-[10px] text-zinc-700">
                        <span className="block truncate">{customer.phone}</span>
                        <small className="mt-1 block truncate text-[9px] text-zinc-400">{customer.email ?? 'Sin correo'}</small>
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        {customer.tags.slice(0, 2).map((tag) => (
                          <em key={tag} className="rounded-full bg-gold-50 px-2 py-1 text-[8px] font-medium not-italic text-gold-700 ring-1 ring-inset ring-gold-200">
                            {tag}
                          </em>
                        ))}
                      </span>
                      <span className="text-[9px] text-zinc-400">{customer.lastSeen}</span>
                      <ChevronRight size={16} className="text-zinc-300" />
                    </button>
                  ))}
                </section>

                <CustomerDetails
                  customer={customers.find((item) => item.id === selectedCustomerId) ?? customers[0]}
                  conversation={conversations.find((item) => item.customerId === selectedCustomerId)}
                  onOpenCustomers={() => undefined}
                  compact
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function SidebarButton({
  active,
  icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[12px] font-medium transition ${
        active
          ? 'bg-white/10 text-white shadow-sm ring-1 ring-inset ring-white/10'
          : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
      }`}
    >
      <span className={active ? 'text-gold-300' : ''}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold-500 px-1.5 text-[8px] font-bold text-harmony-900">{badge}</span>
      ) : null}
    </button>
  );
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' | 'xl' }) {
  const sizeClass = size === 'xl' ? 'h-16 w-16 text-base' : size === 'lg' ? 'h-11 w-11 text-[11px]' : 'h-10 w-10 text-[10px]';
  return (
    <div className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-harmony-600 to-harmony-800 font-semibold text-white shadow-sm ${sizeClass}`}>
      {initials(name)}
    </div>
  );
}

function CustomerDetails({
  customer,
  conversation,
  onOpenCustomers,
  compact = false,
}: {
  customer: Customer;
  conversation?: Conversation;
  onOpenCustomers: () => void;
  compact?: boolean;
}) {
  return (
    <aside className={`${compact ? '' : 'hidden xl:block'} overflow-y-auto rounded-2xl border border-zinc-200/80 bg-white shadow-[0_10px_35px_rgba(24,60,43,0.05)]`}>
      <div className="border-b border-zinc-100 px-5 py-6 text-center">
        <div className="mx-auto w-fit"><Avatar name={customer.name} size="xl" /></div>
        <strong className="mt-3 block text-[13px] font-semibold">{customer.name}</strong>
        <span className="mt-1 block text-[9px] text-zinc-400">{customer.phone}</span>
      </div>

      <DetailsSection title="Información">
        <dl className="space-y-3.5">
          <DetailRow label="Correo" value={customer.email ?? 'Sin registrar'} />
          <DetailRow label="Cliente desde" value={customer.createdAt} />
          <DetailRow label="Última actividad" value={customer.lastSeen} />
          <DetailRow label="Canal" value="WhatsApp" />
        </dl>
      </DetailsSection>

      <DetailsSection title="Etiquetas">
        <div className="flex flex-wrap gap-1.5">
          {customer.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-gold-50 px-2.5 py-1.5 text-[8px] font-medium text-gold-700 ring-1 ring-inset ring-gold-200">
              {tag}
            </span>
          ))}
        </div>
      </DetailsSection>

      <DetailsSection title="Notas internas">
        <p className="m-0 text-[9px] leading-4 text-zinc-500">{customer.notes ?? 'Sin notas internas todavía.'}</p>
      </DetailsSection>

      {conversation && (
        <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-harmony-50 text-harmony-700">
            <UserRound size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[8px] text-zinc-400">Asignado a</span>
            <strong className="mt-1 block truncate text-[10px] font-semibold">{conversation.assignedTo ?? 'Sin asignar'}</strong>
          </div>
        </div>
      )}

      {!compact && (
        <button onClick={onOpenCustomers} className="flex w-full items-center justify-between px-5 py-4 text-[9px] font-semibold text-harmony-700 transition hover:bg-harmony-50">
          Ver ficha completa del cliente <ChevronRight size={15} />
        </button>
      )}
    </aside>
  );
}

function DetailsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-zinc-100 px-5 py-4">
      <h3 className="mb-3 text-[10px] font-semibold text-zinc-800">{title}</h3>
      {children}
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[8px] text-zinc-400">{label}</dt>
      <dd className="mt-1 break-words text-[9px] font-medium text-zinc-700">{value}</dd>
    </div>
  );
}
