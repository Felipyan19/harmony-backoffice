import type { Conversation, ConversationLabel, ConversationLabelColor } from './conversation';

export const ALL_LABELS_FILTER = 'all';

const LABEL_COLORS: ConversationLabelColor[] = ['gold', 'green', 'blue', 'rose', 'violet', 'zinc'];

export function normalizeConversationLabelName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function findConversationLabelByName(labels: ConversationLabel[], name: string) {
  const normalized = normalizeConversationLabelName(name).toLocaleLowerCase('es');
  return labels.find((label) => label.name.toLocaleLowerCase('es') === normalized);
}

export function nextConversationLabelColor(index: number): ConversationLabelColor {
  return LABEL_COLORS[index % LABEL_COLORS.length];
}

export function matchesConversationLabel(conversation: Conversation, labelId: string) {
  return labelId === ALL_LABELS_FILTER || conversation.labels.some((label) => label.id === labelId);
}
