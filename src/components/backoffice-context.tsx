'use client';

import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { customers, initialConversationLabels, initialConversations } from '@/lib/mock-data';
import type { Conversation, ConversationLabel } from '@/types/domain';
import { countConversationsByLabel } from '@/modules/conversations/domain/conversation-labels';

interface BackofficeContextValue {
  conversations: Conversation[];
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  labels: ConversationLabel[];
  setLabels: Dispatch<SetStateAction<ConversationLabel[]>>;
  selectedConversationId: string;
  setSelectedConversationId: Dispatch<SetStateAction<string>>;
  selectedCustomerId: string;
  setSelectedCustomerId: Dispatch<SetStateAction<string>>;
  selectedLabelIds: string[];
  setSelectedLabelIds: Dispatch<SetStateAction<string[]>>;
  toggleLabelFilter: (labelId: string) => void;
  clearLabelFilter: () => void;
  labelCounts: Record<string, number>;
  unreadCount: number;
  pendingCount: number;
}

const BackofficeContext = createContext<BackofficeContextValue | null>(null);

export function BackofficeStateProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [labels, setLabels] = useState<ConversationLabel[]>(initialConversationLabels);
  const [selectedConversationId, setSelectedConversationId] = useState(initialConversations[0].id);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0].id);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const labelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const label of labels) counts[label.id] = countConversationsByLabel(conversations, label.id);
    return counts;
  }, [labels, conversations]);

  const unreadCount = useMemo(() => conversations.reduce((total, item) => total + item.unreadCount, 0), [conversations]);
  const pendingCount = useMemo(() => conversations.filter((item) => item.status === 'pending').length, [conversations]);

  function toggleLabelFilter(labelId: string) {
    setSelectedLabelIds((current) => current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId]);
  }

  function clearLabelFilter() {
    setSelectedLabelIds([]);
  }

  const value: BackofficeContextValue = {
    conversations,
    setConversations,
    labels,
    setLabels,
    selectedConversationId,
    setSelectedConversationId,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedLabelIds,
    setSelectedLabelIds,
    toggleLabelFilter,
    clearLabelFilter,
    labelCounts,
    unreadCount,
    pendingCount,
  };

  return <BackofficeContext.Provider value={value}>{children}</BackofficeContext.Provider>;
}

export function useBackofficeState() {
  const context = useContext(BackofficeContext);
  if (!context) throw new Error('useBackofficeState must be used within BackofficeStateProvider');
  return context;
}
