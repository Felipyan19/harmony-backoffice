import type { ConversationRepository } from '../../application/ports/conversation-repository';
import type { Conversation, ConversationStatus, Message, SenderType } from '../../domain/conversation';
import { getDatabase } from '@/shared/infrastructure/database/neon';

export class NeonConversationRepository implements ConversationRepository {
  async list(): Promise<Conversation[]> {
    const sql = getDatabase();
    const conversations = await sql`SELECT id, customer_id, channel, status, unread_count, last_message_at FROM conversations ORDER BY last_message_at DESC NULLS LAST`;
    return Promise.all(conversations.map((row) => this.mapConversation(row)));
  }

  async findById(id: string): Promise<Conversation | null> {
    const sql = getDatabase();
    const rows = await sql`SELECT id, customer_id, channel, status, unread_count, last_message_at FROM conversations WHERE id = ${id} LIMIT 1`;
    return rows[0] ? this.mapConversation(rows[0]) : null;
  }

  async appendMessage(conversationId: string, message: Message): Promise<void> {
    const sql = getDatabase();
    const senderType = message.senderType === 'bot' ? 'ai' : message.senderType;
    await sql`INSERT INTO messages (conversation_id, direction, sender_type, sender_name, content, status, created_at) VALUES (${conversationId}, ${message.direction}, ${senderType}, ${message.senderName}, ${message.content}, ${message.status ?? 'sent'}, ${message.createdAt})`;
    await sql`UPDATE conversations SET last_message_at = ${message.createdAt}, updated_at = now() WHERE id = ${conversationId}`;
  }

  async changeStatus(conversationId: string, status: ConversationStatus): Promise<void> {
    const sql = getDatabase();
    await sql`UPDATE conversations SET status = ${status}, updated_at = now() WHERE id = ${conversationId}`;
  }

  private async mapConversation(row: Record<string, unknown>): Promise<Conversation> {
    const sql = getDatabase();
    const messages = await sql`SELECT id, conversation_id, content, direction, sender_type, sender_name, created_at, status FROM messages WHERE conversation_id = ${String(row.id)} ORDER BY created_at ASC`;
    return {
      id: String(row.id),
      customerId: String(row.customer_id),
      channel: row.channel === 'webchat' ? 'web' : 'whatsapp',
      status: row.status as ConversationStatus,
      unreadCount: Number(row.unread_count ?? 0),
      lastMessageAt: row.last_message_at ? new Date(String(row.last_message_at)).toISOString() : '',
      messages: messages.map((message) => ({
        id: String(message.id),
        conversationId: String(message.conversation_id),
        content: String(message.content),
        direction: message.direction as Message['direction'],
        senderType: (message.sender_type === 'ai' ? 'bot' : message.sender_type) as SenderType,
        senderName: String(message.sender_name ?? 'Harmony'),
        createdAt: new Date(String(message.created_at)).toISOString(),
        status: ['sent', 'delivered', 'read'].includes(String(message.status)) ? message.status as Message['status'] : 'sent',
      })),
    };
  }
}
