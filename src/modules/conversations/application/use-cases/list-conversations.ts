import type { ConversationRepository } from '../ports/conversation-repository';

export class ListConversations {
  constructor(private readonly conversations: ConversationRepository) {}

  execute(workspaceId: string) {
    return this.conversations.list(workspaceId);
  }
}
