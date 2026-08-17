import { describe, expect, it } from 'vitest';
import type { Conversation, ConversationLabel } from './conversation';
import {
  ALL_LABELS_FILTER,
  findConversationLabelByName,
  matchesConversationLabel,
  normalizeConversationLabelName,
} from './conversation-labels';

const priority: ConversationLabel = { id: 'priority', name: 'Prioridad', color: 'gold' };
const booking: ConversationLabel = { id: 'booking', name: 'Reserva', color: 'green' };

const conversation = (labels: ConversationLabel[]): Conversation => ({
  id: 'conversation-1',
  customerId: 'customer-1',
  channel: 'whatsapp',
  status: 'open',
  unreadCount: 0,
  lastMessageAt: 'Ahora',
  labels,
  messages: [],
});

describe('conversation labels', () => {
  it('normalizes extra whitespace when creating labels', () => {
    expect(normalizeConversationLabelName('  Plan   romántico  ')).toBe('Plan romántico');
  });

  it('finds existing labels case-insensitively', () => {
    expect(findConversationLabelByName([priority, booking], '  PRIORIDAD ')).toEqual(priority);
  });

  it('matches every conversation when all labels are selected', () => {
    expect(matchesConversationLabel(conversation([]), ALL_LABELS_FILTER)).toBe(true);
  });

  it('matches only conversations assigned to the selected label', () => {
    expect(matchesConversationLabel(conversation([priority]), priority.id)).toBe(true);
    expect(matchesConversationLabel(conversation([booking]), priority.id)).toBe(false);
  });
});
