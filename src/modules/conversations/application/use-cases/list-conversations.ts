import type { ConversationRepository } from '../ports/conversation-repository';

export class ListConversations {
  constructor(private readonly conversations: ConversationRepository) {}

  execute() {
    return this.conversations.list();
  }
}
