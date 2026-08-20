import type { Conversation, ConversationStatus, Message } from '../../domain/conversation';

export interface ConversationRepository {
  list(workspaceId: string): Promise<Conversation[]>;
  findById(workspaceId: string, id: string): Promise<Conversation | null>;
  appendMessage(workspaceId: string, conversationId: string, message: Message): Promise<void>;
  changeStatus(workspaceId: string, conversationId: string, status: ConversationStatus): Promise<void>;
}
