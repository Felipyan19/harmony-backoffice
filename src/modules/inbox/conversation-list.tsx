import type { Conversation, ConversationStatus, Customer } from '@/types/domain';
import { Avatar, EmptyState, SearchInput, StatusBadge, statusLabel } from '@/modules/shared/ui';

export type InboxFilter = 'all' | ConversationStatus;

const filterLabel: Record<InboxFilter, string> = {
  all: 'Todas',
  open: 'Abiertas',
  pending: 'Pendientes',
  resolved: 'Resueltas',
};

export function ConversationList({ conversations, customers, selectedId, query, filter, onQueryChange, onFilterChange, onSelect }: {
  conversations: Conversation[];
  customers: Customer[];
  selectedId: string;
  query: string;
  filter: InboxFilter;
  onQueryChange: (value: string) => void;
  onFilterChange: (value: InboxFilter) => void;
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
