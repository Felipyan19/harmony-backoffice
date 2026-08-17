// Compatibility exports while presentation components migrate to module-local domain types.
export type { Customer } from '@/modules/customers/domain/customer';
export type {
  Channel,
  Conversation,
  ConversationLabel,
  ConversationLabelColor,
  ConversationStatus,
  Message,
  MessageDirection,
  SenderType,
} from '@/modules/conversations/domain/conversation';
