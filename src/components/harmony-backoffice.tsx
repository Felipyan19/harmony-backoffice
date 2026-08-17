'use client';

import { FormEvent, useMemo, useState } from 'react';
import { CheckCheck, ChevronRight, Inbox, MessageCircle, Search, Send, Sparkles, UserRound, Users } from 'lucide-react';
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
  resolved: 'Resuelta'
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
      const matchesQuery = !normalizedQuery || customer?.name.toLowerCase().includes(normalizedQuery) || customer?.phone.includes(normalizedQuery) || lastMessage.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [conversations, filter, query]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.email ?? '', ...customer.tags].some((value) => value.toLowerCase().includes(normalizedQuery))
    );
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
    if (!content || !selectedConversation) return;

    const nextMessage = {
      id: `msg_${Date.now()}`,
      conversationId: selectedConversation.id,
      content,
      direction: 'outgoing' as const,
      senderType: 'agent' as const,
      senderName: 'Atención Harmony',
      createdAt: new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
      status: 'sent' as const
    };

    setConversations((current) => current.map((conversation) =>
      conversation.id === selectedConversation.id
        ? { ...conversation, status: 'open', assignedTo: 'Atención Harmony', lastMessageAt: 'Ahora', messages: [...conversation.messages, nextMessage] }
        : conversation
    ));
    setDraft('');
  }

  function changeStatus(status: ConversationStatus) {
    if (!selectedConversation) return;
    setConversations((current) => current.map((item) => item.id === selectedConversation.id ? { ...item, status } : item));
  }

  const pendingCount = conversations.filter((item) => item.status === 'pending').length;
  const unreadCount = conversations.reduce((total, item) => total + item.unreadCount, 0);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">H</div>
          <div>
            <strong>Harmony</strong>
            <span>Backoffice</span>
          </div>
        </div>

        <nav className="nav-stack" aria-label="Principal">
          <button className={view === 'conversations' ? 'nav-item active' : 'nav-item'} onClick={() => setView('conversations')}>
            <Inbox size={18} />
            <span>Conversaciones</span>
            {unreadCount > 0 && <b>{unreadCount}</b>}
          </button>
          <button className={view === 'customers' ? 'nav-item active' : 'nav-item'} onClick={() => setView('customers')}>
            <Users size={18} />
            <span>Clientes</span>
          </button>
        </nav>

        <div className="sidebar-spacer" />
        <div className="agent-card">
          <span className="status-dot" />
          <div>
            <strong>Harmony IA</strong>
            <small>Agente conectado</small>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operación de atención</p>
            <h1>{view === 'conversations' ? 'Conversaciones' : 'Clientes'}</h1>
          </div>
          <div className="topbar-actions">
            <div className="metric-pill"><MessageCircle size={15} /> {pendingCount} pendientes</div>
            <div className="avatar">FH</div>
          </div>
        </header>

        {view === 'conversations' ? (
          <div className="conversation-layout">
            <section className="conversation-list-panel">
              <div className="panel-toolbar">
                <label className="search-box">
                  <Search size={16} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente o mensaje…" />
                </label>
                <div className="filter-row">
                  {(['all', 'pending', 'open', 'resolved'] as Filter[]).map((item) => (
                    <button key={item} className={filter === item ? 'filter-chip active' : 'filter-chip'} onClick={() => setFilter(item)}>
                      {item === 'all' ? 'Todas' : statusLabel[item]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="conversation-list">
                {filteredConversations.map((conversation) => {
                  const customer = customers.find((item) => item.id === conversation.customerId)!;
                  const lastMessage = conversation.messages.at(-1);
                  const selected = conversation.id === selectedConversationId;
                  return (
                    <button key={conversation.id} className={selected ? 'conversation-row selected' : 'conversation-row'} onClick={() => openConversation(conversation)}>
                      <div className="customer-avatar">{initials(customer.name)}</div>
                      <div className="conversation-copy">
                        <div className="conversation-title-row">
                          <strong>{customer.name}</strong>
                          <span>{conversation.lastMessageAt}</span>
                        </div>
                        <p>{lastMessage?.content}</p>
                        <div className="conversation-meta">
                          <span className={`status-badge ${conversation.status}`}>{statusLabel[conversation.status]}</span>
                          <span>WhatsApp</span>
                        </div>
                      </div>
                      {conversation.unreadCount > 0 && <span className="unread-badge">{conversation.unreadCount}</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="chat-panel">
              <header className="chat-header">
                <div className="chat-person">
                  <div className="customer-avatar large">{initials(selectedCustomer.name)}</div>
                  <div>
                    <strong>{selectedCustomer.name}</strong>
                    <span>{selectedCustomer.phone} · WhatsApp</span>
                  </div>
                </div>
                <select value={selectedConversation.status} onChange={(event) => changeStatus(event.target.value as ConversationStatus)} aria-label="Estado de conversación">
                  <option value="open">Abierta</option>
                  <option value="pending">Pendiente</option>
                  <option value="resolved">Resuelta</option>
                </select>
              </header>

              <div className="message-stream">
                <div className="date-divider"><span>Hoy</span></div>
                {selectedConversation.messages.map((message) => (
                  <div key={message.id} className={message.direction === 'outgoing' ? 'message-row outgoing' : 'message-row incoming'}>
                    <div className={`message-bubble ${message.senderType}`}>
                      {message.senderType !== 'customer' && <small>{message.senderType === 'bot' ? 'Harmony IA' : message.senderName}</small>}
                      <p>{message.content}</p>
                      <footer>
                        <span>{message.createdAt}</span>
                        {message.direction === 'outgoing' && <CheckCheck size={14} />}
                      </footer>
                    </div>
                  </div>
                ))}
              </div>

              <form className="composer" onSubmit={sendMessage}>
                <div className="composer-context"><Sparkles size={14} /> Respondiendo como Atención Harmony</div>
                <div className="composer-row">
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escribe un mensaje…" rows={2} />
                  <button type="submit" aria-label="Enviar mensaje"><Send size={18} /></button>
                </div>
              </form>
            </section>

            <CustomerDetails customer={selectedCustomer} conversation={selectedConversation} onOpenCustomers={() => setView('customers')} />
          </div>
        ) : (
          <div className="customers-page">
            <div className="customers-toolbar">
              <label className="search-box wide">
                <Search size={16} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, teléfono, correo o etiqueta…" />
              </label>
              <span>{filteredCustomers.length} clientes</span>
            </div>
            <div className="customers-layout">
              <section className="customers-table">
                <div className="table-head"><span>Cliente</span><span>Contacto</span><span>Etiquetas</span><span>Última actividad</span><span /></div>
                {filteredCustomers.map((customer) => (
                  <button key={customer.id} className={selectedCustomerId === customer.id ? 'customer-table-row active' : 'customer-table-row'} onClick={() => openCustomer(customer)}>
                    <span className="customer-name-cell"><span className="customer-avatar">{initials(customer.name)}</span><strong>{customer.name}</strong></span>
                    <span>{customer.phone}<small>{customer.email ?? 'Sin correo'}</small></span>
                    <span className="tag-cell">{customer.tags.slice(0, 2).map((tag) => <em key={tag}>{tag}</em>)}</span>
                    <span>{customer.lastSeen}</span>
                    <ChevronRight size={17} />
                  </button>
                ))}
              </section>
              <CustomerDetails customer={customers.find((item) => item.id === selectedCustomerId) ?? customers[0]} conversation={conversations.find((item) => item.customerId === selectedCustomerId)} onOpenCustomers={() => undefined} compact />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function CustomerDetails({ customer, conversation, onOpenCustomers, compact = false }: { customer: Customer; conversation?: Conversation; onOpenCustomers: () => void; compact?: boolean }) {
  return (
    <aside className={compact ? 'details-panel compact' : 'details-panel'}>
      <div className="details-hero">
        <div className="customer-avatar xl">{initials(customer.name)}</div>
        <strong>{customer.name}</strong>
        <span>{customer.phone}</span>
      </div>
      <div className="details-section">
        <h3>Datos del cliente</h3>
        <dl>
          <div><dt>Correo</dt><dd>{customer.email ?? 'Sin registrar'}</dd></div>
          <div><dt>Cliente desde</dt><dd>{customer.createdAt}</dd></div>
          <div><dt>Última actividad</dt><dd>{customer.lastSeen}</dd></div>
        </dl>
      </div>
      <div className="details-section">
        <h3>Etiquetas</h3>
        <div className="tag-list">{customer.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>
      <div className="details-section">
        <h3>Notas</h3>
        <p>{customer.notes ?? 'Sin notas internas todavía.'}</p>
      </div>
      {conversation && (
        <div className="details-section assignment">
          <UserRound size={16} />
          <div><span>Asignado a</span><strong>{conversation.assignedTo ?? 'Sin asignar'}</strong></div>
        </div>
      )}
      {!compact && <button className="text-action" onClick={onOpenCustomers}>Ver ficha completa del cliente <ChevronRight size={15} /></button>}
    </aside>
  );
}
