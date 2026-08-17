import type { ConversationRepository } from '../ports/conversation-repository';
import type { MessageGateway } from '../ports/message-gateway';
import type { Message } from '../../domain/conversation';

export class SendMessage {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly gateway: MessageGateway,
  ) {}

  async execute(input: { conversationId: string; recipient: string; content: string; senderName: string }) {
    const content = input.content.trim();
    if (!content) throw new Error('Message content is required');

    const conversation = await this.conversations.findById(input.conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const delivery = await this.gateway.send({
      conversationId: input.conversationId,
      recipient: input.recipient,
      content,
    });

    const message: Message = {
      id: delivery.externalId ?? `msg_${Date.now()}`,
      conversationId: input.conversationId,
      content,
      direction: 'outgoing',
      senderType: 'agent',
      senderName: input.senderName,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    await this.conversations.appendMessage(input.conversationId, message);
    return message;
  }
}
