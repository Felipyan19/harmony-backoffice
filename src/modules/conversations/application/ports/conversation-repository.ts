import type { Conversation, ConversationStatus, Message } from '../../domain/conversation';

export interface ConversationRepository {
  list(): Promise<Conversation[]>;
  findById(id: string): Promise<Conversation | null>;
  appendMessage(conversationId: string, message: Message): Promise<void>;
  changeStatus(conversationId: string, status: ConversationStatus): Promise<void>;
}
