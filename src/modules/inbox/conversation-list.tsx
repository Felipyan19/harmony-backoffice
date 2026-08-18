import { Check } from 'lucide-react';
import type { Conversation, ConversationLabel, ConversationStatus, Customer } from '@/types/domain';
import { Avatar, EmptyState, Panel, SearchInput, StatusBadge } from '@/modules/shared/ui';
import { ConversationLabelBadge, ConversationLabelBulkBar, ConversationLabelFilterMenu } from './conversation-labels';

export type InboxFilter = 'all' | ConversationStatus;

const filterLabel: Record<InboxFilter, string> = {
  all: 'Todas',
  open: 'Abiertas',
  pending: 'Pendientes',
  resolved: 'Resueltas',
};

export function ConversationList({
  conversations, customers, labels, labelCounts, selectedId, query, filter, selectedLabelIds,
  onQueryChange, onFilterChange, onToggleLabelFilter, onClearLabelFilter, onSelect,
  selectionMode, selectedConversationIds, onToggleSelectionMode, onToggleConversationSelection, onClearConversationSelection,
  onBulkApplyLabel, onBulkRemoveLabel,
}: {
  conversations: Conversation[];
  customers: Customer[];
  labels: ConversationLabel[];
  labelCounts: Record<string, number>;
  selectedId: string;
  query: string;
  filter: InboxFilter;
  selectedLabelIds: string[];
  onQueryChange: (value: string) => void;
  onFilterChange: (value: InboxFilter) => void;
  onToggleLabelFilter: (labelId: string) => void;
  onClearLabelFilter: () => void;
  onSelect: (conversation: Conversation) => void;
  selectionMode: boolean;
  selectedConversationIds: Set<string>;
  onToggleSelectionMode: () => void;
  onToggleConversationSelection: (conversationId: string) => void;
  onClearConversationSelection: () => void;
  onBulkApplyLabel: (labelId: string) => void;
  onBulkRemoveLabel: (labelId: string) => void;
}) {
  return (
    <Panel className="flex min-h-[540px] flex-col overflow-hidden xl:min-h-0">
      <div className="border-b border-neutral/10 p-3.5">
        <SearchInput value={query} onChange={onQueryChange} placeholder="Buscar cliente o mensaje..." />
        <div className="mt-3 grid grid-cols-4 gap-1 rounded-lg bg-neutral/8 p-1">
          {(['all', 'open', 'pending', 'resolved'] as InboxFilter[]).map((item) => (
            <button key={item} onClick={() => onFilterChange(item)} className={`rounded-md px-2 py-2 text-sm font-medium transition ${filter === item ? 'bg-white text-primary ring-1 ring-neutral/12' : 'text-neutral/60 hover:text-neutral'}`}>
              {filterLabel[item]}
            </button>
          ))}
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <ConversationLabelFilterMenu labels={labels} counts={labelCounts} selectedLabelIds={selectedLabelIds} onToggle={onToggleLabelFilter} onClear={onClearLabelFilter} />
          <button type="button" onClick={onToggleSelectionMode} className={`h-10 shrink-0 rounded-md border px-3 text-sm font-medium transition ${selectionMode ? 'border-primary/40 bg-primary/8 text-primary' : 'border-neutral/15 bg-white text-neutral/70 hover:bg-neutral/5'}`}>
            {selectionMode ? 'Cancelar' : 'Seleccionar'}
          </button>
        </div>
      </div>

      {selectionMode && selectedConversationIds.size > 0 ? (
        <ConversationLabelBulkBar labels={labels} selectedCount={selectedConversationIds.size} onApply={onBulkApplyLabel} onRemove={onBulkRemoveLabel} onClear={onClearConversationSelection} />
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <EmptyState title="Sin conversaciones" description="No hay conversaciones que coincidan con los filtros actuales." />
        ) : conversations.map((conversation) => {
          const customer = customers.find((item) => item.id === conversation.customerId)!;
          const lastMessage = conversation.messages.at(-1);
          const selected = conversation.id === selectedId;
          const checked = selectedConversationIds.has(conversation.id);
          return (
            <div key={conversation.id} className={`relative flex w-full gap-3 border-b border-neutral/10 px-4 py-4 transition ${selected && !selectionMode ? 'bg-primary/6 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-primary' : 'bg-white hover:bg-neutral/4'}`}>
              {selectionMode ? (
                <button type="button" onClick={() => onToggleConversationSelection(conversation.id)} aria-label="Seleccionar conversación" className={`mt-1 grid h-5 w-5 shrink-0 place-items-center self-start rounded-md border transition ${checked ? 'border-primary bg-primary text-white' : 'border-neutral/20 bg-white text-transparent hover:border-neutral/30'}`}>
                  <Check size={12} />
                </button>
              ) : null}
              <button onClick={() => (selectionMode ? onToggleConversationSelection(conversation.id) : onSelect(conversation))} className="flex min-w-0 flex-1 gap-3 text-left">
                <Avatar name={customer.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="truncate text-base font-semibold text-neutral">{customer.name}</strong>
                    <span className="shrink-0 text-sm text-neutral/40">{conversation.lastMessageAt}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-4 text-neutral/60">{lastMessage?.content}</p>
                  {conversation.labels.length > 0 ? (
                    <div className="mt-2 flex min-w-0 flex-wrap gap-1">
                      {conversation.labels.slice(0, 2).map((label) => <ConversationLabelBadge key={label.id} label={label} compact />)}
                      {conversation.labels.length > 2 ? <span className="rounded-full bg-neutral/8 px-2 py-0.5 text-sm font-medium text-neutral/60">+{conversation.labels.length - 2}</span> : null}
                    </div>
                  ) : null}
                  <div className="mt-2.5 flex items-center gap-2">
                    <StatusBadge status={conversation.status} />
                    <span className="text-sm text-neutral/40">WhatsApp</span>
                    {conversation.assignedTo && <span className="truncate text-sm text-neutral/40">· {conversation.assignedTo}</span>}
                  </div>
                </div>
              </button>
              {conversation.unreadCount > 0 && <span className="absolute bottom-4 right-4 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-sm font-bold text-white">{conversation.unreadCount}</span>}
            </div>
          );
        })}
      </div>

      <div className="border-t border-neutral/10 p-3">
        <button className="w-full rounded-md border border-neutral/15 bg-white py-2.5 text-sm font-medium text-neutral/60 transition hover:bg-neutral/5">Cargar más conversaciones</button>
      </div>
    </Panel>
  );
}
