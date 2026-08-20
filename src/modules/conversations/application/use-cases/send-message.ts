import type { ConversationRepository } from '../ports/conversation-repository';
import type { MessageGateway } from '../ports/message-gateway';
import type { Message } from '../../domain/conversation';

export class SendMessage {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly gateway: MessageGateway,
  ) {}

  async execute(input: {
    workspaceId: string;
    conversationId: string;
    recipient: string;
    content: string;
    senderName: string;
    senderProfileId?: string;
    senderMembershipId?: string;
  }) {
    const content = input.content.trim();
    if (!content) throw new Error('Message content is required');

    const conversation = await this.conversations.findById(input.workspaceId, input.conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const delivery = await this.gateway.send({
      conversationId: input.conversationId,
      recipient: input.recipient,
      content,
    });

    const message: Message = {
      id: crypto.randomUUID(),
      conversationId: input.conversationId,
      externalId: delivery.externalId,
      content,
      direction: 'outgoing',
      senderType: 'agent',
      senderProfileId: input.senderProfileId,
      senderMembershipId: input.senderMembershipId,
      senderName: input.senderName,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    await this.conversations.appendMessage(input.workspaceId, input.conversationId, message);
    return message;
  }
}
