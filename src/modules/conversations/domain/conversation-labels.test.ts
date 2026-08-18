import { describe, expect, it } from 'vitest';
import type { Conversation, ConversationLabel } from './conversation';
import {
  countConversationsByLabel,
  findConversationLabelByName,
  matchesConversationLabels,
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

  it('matches every conversation when no label is selected', () => {
    expect(matchesConversationLabels(conversation([]), [])).toBe(true);
  });

  it('matches only conversations assigned to one of the selected labels', () => {
    expect(matchesConversationLabels(conversation([priority]), [priority.id])).toBe(true);
    expect(matchesConversationLabels(conversation([booking]), [priority.id])).toBe(false);
  });

  it('matches conversations that carry any of several selected labels', () => {
    expect(matchesConversationLabels(conversation([booking]), [priority.id, booking.id])).toBe(true);
    expect(matchesConversationLabels(conversation([]), [priority.id, booking.id])).toBe(false);
  });

  it('counts how many conversations carry a given label', () => {
    const conversations = [conversation([priority]), conversation([priority, booking]), conversation([booking])];
    expect(countConversationsByLabel(conversations, priority.id)).toBe(2);
    expect(countConversationsByLabel(conversations, booking.id)).toBe(2);
  });
});
