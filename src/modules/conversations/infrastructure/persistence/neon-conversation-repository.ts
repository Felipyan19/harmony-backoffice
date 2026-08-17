import 'server-only';

import { asc, desc, eq } from 'drizzle-orm';
import type { ConversationRepository } from '../../application/ports/conversation-repository';
import type { Conversation, ConversationStatus, Message, SenderType } from '../../domain/conversation';
import { getDrizzleDatabase } from '@/shared/infrastructure/database/drizzle';
import { conversations, messages } from '@/shared/infrastructure/database/schema';

export class NeonConversationRepository implements ConversationRepository {
  async list(): Promise<Conversation[]> {
    const db = getDrizzleDatabase();
    const rows = await db.select().from(conversations).orderBy(desc(conversations.lastMessageAt));
    return Promise.all(rows.map((row) => this.mapConversation(row)));
  }

  async findById(id: string): Promise<Conversation | null> {
    const db = getDrizzleDatabase();
    const [row] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return row ? this.mapConversation(row) : null;
  }

  async appendMessage(conversationId: string, message: Message): Promise<void> {
    const db = getDrizzleDatabase();
    const parsed = new Date(message.createdAt);
    const createdAt = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    const senderType = message.senderType === 'bot' ? 'ai' : message.senderType;

    await db.insert(messages).values({
      conversationId,
      direction: message.direction,
      senderType,
      senderName: message.senderName,
      content: message.content,
      status: message.status ?? 'sent',
      createdAt,
    });
    await db.update(conversations).set({ lastMessageAt: createdAt, updatedAt: new Date() }).where(eq(conversations.id, conversationId));
  }

  async changeStatus(conversationId: string, status: ConversationStatus): Promise<void> {
    const db = getDrizzleDatabase();
    await db.update(conversations).set({ status, updatedAt: new Date() }).where(eq(conversations.id, conversationId));
  }

  private async mapConversation(row: typeof conversations.$inferSelect): Promise<Conversation> {
    const db = getDrizzleDatabase();
    const messageRows = await db.select().from(messages).where(eq(messages.conversationId, row.id)).orderBy(asc(messages.createdAt));

    return {
      id: row.id,
      customerId: row.customerId,
      channel: row.channel === 'webchat' ? 'web' : 'whatsapp',
      status: row.status as ConversationStatus,
      unreadCount: row.unreadCount ?? 0,
      lastMessageAt: row.lastMessageAt?.toISOString() ?? '',
      messages: messageRows.map((message) => ({
        id: message.id,
        conversationId: message.conversationId,
        content: message.content,
        direction: message.direction as Message['direction'],
        senderType: (message.senderType === 'ai' ? 'bot' : message.senderType) as SenderType,
        senderName: message.senderName ?? 'Harmony',
        createdAt: message.createdAt.toISOString(),
        status: ['sent', 'delivered', 'read'].includes(message.status) ? message.status as Message['status'] : 'sent',
      })),
    };
  }
}
