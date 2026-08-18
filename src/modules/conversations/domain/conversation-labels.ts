import type { Conversation, ConversationLabel, ConversationLabelColor } from './conversation';

export const CONVERSATION_LABEL_COLORS: ConversationLabelColor[] = ['gold', 'green', 'blue', 'rose', 'violet', 'zinc'];

export function normalizeConversationLabelName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function findConversationLabelByName(labels: ConversationLabel[], name: string) {
  const normalized = normalizeConversationLabelName(name).toLocaleLowerCase('es');
  return labels.find((label) => label.name.toLocaleLowerCase('es') === normalized);
}

export function nextConversationLabelColor(index: number): ConversationLabelColor {
  return CONVERSATION_LABEL_COLORS[index % CONVERSATION_LABEL_COLORS.length];
}

export function matchesConversationLabels(conversation: Conversation, labelIds: string[]) {
  if (labelIds.length === 0) return true;
  return conversation.labels.some((label) => labelIds.includes(label.id));
}

export function countConversationsByLabel(conversations: Conversation[], labelId: string) {
  return conversations.reduce((total, conversation) => total + (conversation.labels.some((label) => label.id === labelId) ? 1 : 0), 0);
}
