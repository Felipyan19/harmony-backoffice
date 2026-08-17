import { Tags } from 'lucide-react';
import type { Conversation, ConversationLabel, ConversationStatus, Customer } from '@/types/domain';
import { ALL_LABELS_FILTER } from '@/modules/conversations/domain/conversation-labels';
import { Avatar, EmptyState, SearchInput, StatusBadge } from '@/modules/shared/ui';
import { ConversationLabelBadge } from './conversation-labels';

export type InboxFilter = 'all' | ConversationStatus;

const filterLabel: Record<InboxFilter, string> = {
  all: 'Todas',
  open: 'Abiertas',
  pending: 'Pendientes',
  resolved: 'Resueltas',
};

export function ConversationList({ conversations, customers, labels, selectedId, query, filter, labelFilter, onQueryChange, onFilterChange, onLabelFilterChange, onSelect }: {
  conversations: Conversation[];
  customers: Customer[];
  labels: ConversationLabel[];
  selectedId: string;
  query: string;
  filter: InboxFilter;
  labelFilter: string;
  onQueryChange: (value: string) => void;
  onFilterChange: (value: InboxFilter) => void;
  onLabelFilterChange: (value: string) => void;
  onSelect: (conversation: Conversation) => void;
}) {
  return (
    <section className="flex min-h-[540px] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_10px_35px_rgba(24,60,43,0.05)] xl:min-h-0">
      <div className="border-b border-zinc-100 p-3.5">
        <SearchInput value={query} onChange={onQueryChange} placeholder="Buscar cliente o mensaje..." />
        <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-zinc-100/80 p-1">
          {(['all', 'open', 'pending', 'resolved'] as InboxFilter[]).map((item) => (
            <button key={item} onClick={() => onFilterChange(item)} className={`rounded-lg px-2 py-2 text-[9px] font-medium transition ${filter === item ? 'bg-white text-harmony-800 shadow-sm ring-1 ring-zinc-200/70' : 'text-zinc-500 hover:text-zinc-800'}`}>
              {filterLabel[item]}
            </button>
          ))}
        </div>
        <label className="mt-2.5 flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 transition focus-within:border-harmony-300 focus-within:ring-4 focus-within:ring-harmony-100/60">
          <Tags size={14} className="shrink-0 text-zinc-400" />
          <select value={labelFilter} onChange={(event) => onLabelFilterChange(event.target.value)} aria-label="Filtrar por etiqueta" className="min-w-0 flex-1 appearance-none bg-transparent text-[9px] font-medium text-zinc-600 outline-none">
            <option value={ALL_LABELS_FILTER}>Todas las etiquetas</option>
            {labels.map((label) => <option key={label.id} value={label.id}>{label.name}</option>)}
          </select>
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <EmptyState title="Sin conversaciones" description="No hay conversaciones que coincidan con los filtros actuales." />
        ) : conversations.map((conversation) => {
          const customer = customers.find((item) => item.id === conversation.customerId)!;
          const lastMessage = conversation.messages.at(-1);
          const selected = conversation.id === selectedId;
          return (
            <button key={conversation.id} onClick={() => onSelect(conversation)} className={`relative flex w-full gap-3 border-b border-zinc-100 px-4 py-4 text-left transition ${selected ? 'bg-gradient-to-r from-harmony-50 to-white before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-harmony-700' : 'bg-white hover:bg-zinc-50/70'}`}>
              <Avatar name={customer.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <strong className="truncate text-[12px] font-semibold text-zinc-900">{customer.name}</strong>
                  <span className="shrink-0 text-[9px] text-zinc-400">{conversation.lastMessageAt}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-zinc-500">{lastMessage?.content}</p>
                {conversation.labels.length > 0 ? (
                  <div className="mt-2 flex min-w-0 flex-wrap gap-1">
                    {conversation.labels.slice(0, 2).map((label) => <ConversationLabelBadge key={label.id} label={label} compact />)}
                    {conversation.labels.length > 2 ? <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[7px] font-medium text-zinc-500">+{conversation.labels.length - 2}</span> : null}
                  </div>
                ) : null}
                <div className="mt-2.5 flex items-center gap-2">
                  <StatusBadge status={conversation.status} />
                  <span className="text-[8px] text-zinc-400">WhatsApp</span>
                  {conversation.assignedTo && <span className="truncate text-[8px] text-zinc-400">· {conversation.assignedTo}</span>}
                </div>
              </div>
              {conversation.unreadCount > 0 && <span className="absolute bottom-4 right-4 grid h-5 min-w-5 place-items-center rounded-full bg-gold-500 px-1.5 text-[8px] font-bold text-harmony-900 shadow-sm">{conversation.unreadCount}</span>}
            </button>
          );
        })}
      </div>

      <div className="border-t border-zinc-100 p-3">
        <button className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 text-[9px] font-medium text-zinc-500 transition hover:bg-zinc-50">Cargar más conversaciones</button>
      </div>
    </section>
  );
}
