import type { ConversationRepository } from '../ports/conversation-repository';
import type { ConversationStatus } from '../../domain/conversation';

export class ChangeConversationStatus {
  constructor(private readonly conversations: ConversationRepository) {}

  execute(workspaceId: string, conversationId: string, status: ConversationStatus) {
    return this.conversations.changeStatus(workspaceId, conversationId, status);
  }
}
