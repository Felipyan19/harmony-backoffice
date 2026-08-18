'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { customers } from '@/lib/mock-data';
import type { Conversation, ConversationLabel, ConversationLabelColor, ConversationStatus, Customer } from '@/types/domain';
import {
  findConversationLabelByName,
  matchesConversationLabels,
  nextConversationLabelColor,
  normalizeConversationLabelName,
} from '@/modules/conversations/domain/conversation-labels';
import { ConversationList, type InboxFilter } from '@/modules/inbox/conversation-list';
import { ChatPanel } from '@/modules/inbox/chat-panel';
import { CustomerDetails } from '@/modules/customers/customer-details';
import { LabelManagerDialog } from '@/modules/inbox/label-manager';
import { Avatar, Badge, Panel, SearchInput } from '@/modules/shared/ui';
import { useBackofficeState } from './backoffice-context';

const messageTimeFormatter = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit' });

export function ConversationsPageContent() {
  const router = useRouter();
  const {
    conversations, setConversations,
    labels, setLabels,
    selectedConversationId, setSelectedConversationId,
    setSelectedCustomerId,
    selectedLabelIds, setSelectedLabelIds, toggleLabelFilter, clearLabelFilter,
    labelCounts,
  } = useBackofficeState();

  const [filter, setFilter] = useState<InboxFilter>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedConversationIds, setSelectedConversationIds] = useState<Set<string>>(new Set());
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) ?? conversations[0];
  const selectedCustomer = customers.find((item) => item.id === selectedConversation.customerId) ?? customers[0];

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

  function openConversation(conversation: Conversation) {
    setSelectedConversationId(conversation.id);
    setSelectedCustomerId(conversation.customerId);
    setConversations((current) => current.map((item) => item.id === conversation.id ? { ...item, unreadCount: 0 } : item));
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
      createdAt: messageTimeFormatter.format(new Date()),
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

  function toggleSelectionMode() {
    if (selectionMode) setSelectedConversationIds(new Set());
    setSelectionMode(!selectionMode);
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

  return (
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
        onManageLabels={() => setLabelManagerOpen(true)}
      />
      <ChatPanel conversation={selectedConversation} customer={selectedCustomer} labels={labels} draft={draft} onDraftChange={setDraft} onSend={sendMessage} onStatusChange={changeStatus} onToggleLabel={toggleConversationLabel} onCreateLabel={createConversationLabel} />
      <CustomerDetails customer={selectedCustomer} conversation={selectedConversation} onOpenCustomers={() => router.push('/clientes')} />

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
    </div>
  );
}

export function CustomersPageContent() {
  const { conversations, selectedCustomerId, setSelectedCustomerId, setSelectedConversationId } = useBackofficeState();
  const [query, setQuery] = useState('');

  const filteredCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return customers;
    return customers.filter((customer) => [customer.name, customer.phone, customer.email ?? '', ...customer.tags].some((value) => value.toLowerCase().includes(normalized)));
  }, [query]);

  function openCustomer(customer: Customer) {
    setSelectedCustomerId(customer.id);
    const conversation = conversations.find((item) => item.customerId === customer.id);
    if (conversation) setSelectedConversationId(conversation.id);
  }

  return <CustomersTable customers={filteredCustomers} selectedCustomerId={selectedCustomerId} conversations={conversations} query={query} onQueryChange={setQuery} onSelect={openCustomer} />;
}

function CustomersTable({ customers: rows, selectedCustomerId, conversations, query, onQueryChange, onSelect }: { customers: Customer[]; selectedCustomerId: string; conversations: Conversation[]; query: string; onQueryChange: (value: string) => void; onSelect: (customer: Customer) => void }) {
  const selected = customers.find((item) => item.id === selectedCustomerId) ?? customers[0];
  return (
    <div className="min-h-0 flex-1 overflow-auto p-3 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="w-full max-w-xl"><SearchInput value={query} onChange={onQueryChange} placeholder="Buscar por nombre, teléfono, correo o etiqueta..." /></div>
        <span className="hidden text-sm text-neutral/40 sm:block">{rows.length} clientes</span>
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(680px,1fr)_320px]">
        <Panel className="overflow-hidden">
          <div className="grid grid-cols-[1.1fr_1fr_1fr_.7fr_24px] gap-4 border-b border-neutral/10 bg-neutral/4 px-5 py-3 text-sm font-medium uppercase tracking-wide text-neutral/40">
            <span>Cliente</span><span>Contacto</span><span>Etiquetas</span><span>Actividad</span><span />
          </div>
          {rows.map((customer) => (
            <button key={customer.id} onClick={() => onSelect(customer)} className={`grid w-full grid-cols-[1.1fr_1fr_1fr_.7fr_24px] items-center gap-4 border-b border-neutral/10 px-5 py-4 text-left transition last:border-b-0 ${selectedCustomerId === customer.id ? 'bg-primary/6' : 'hover:bg-neutral/4'}`}>
              <span className="flex items-center gap-3"><Avatar name={customer.name} /><strong className="truncate text-base">{customer.name}</strong></span>
              <span className="min-w-0 text-sm text-neutral/60"><span className="block truncate">{customer.phone}</span><span className="mt-1 block truncate text-neutral/40">{customer.email ?? 'Sin correo'}</span></span>
              <span className="flex flex-wrap gap-1">{customer.tags.slice(0, 2).map((tag) => <Badge key={tag} compact>{tag}</Badge>)}</span>
              <span className="text-sm text-neutral/40">{customer.lastSeen}</span>
              <ChevronRight size={16} className="text-neutral/30" />
            </button>
          ))}
        </Panel>
        <CustomerDetails customer={selected} conversation={conversations.find((item) => item.customerId === selected.id)} compact />
      </div>
    </div>
  );
}
