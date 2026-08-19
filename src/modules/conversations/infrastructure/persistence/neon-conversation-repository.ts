import 'server-only';

import { and, asc, desc, eq } from 'drizzle-orm';
import type { ConversationRepository } from '../../application/ports/conversation-repository';
import type { Conversation, ConversationLabelColor, ConversationStatus, Message, SenderType } from '../../domain/conversation';
import { getDrizzleDatabase } from '@/shared/infrastructure/database/drizzle';
import { conversationLabelAssignments, conversationLabels, conversations, messages } from '@/shared/infrastructure/database/schema';

export class NeonConversationRepository implements ConversationRepository {
  async list(workspaceId: string): Promise<Conversation[]> {
    const db = getDrizzleDatabase();
    const rows = await db
      .select()
      .from(conversations)
      .where(eq(conversations.workspaceId, workspaceId))
      .orderBy(desc(conversations.lastMessageAt));
    return Promise.all(rows.map((row) => this.mapConversation(row)));
  }

  async findById(workspaceId: string, id: string): Promise<Conversation | null> {
    const db = getDrizzleDatabase();
    const [row] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.workspaceId, workspaceId), eq(conversations.id, id)))
      .limit(1);
    return row ? this.mapConversation(row) : null;
  }

  async appendMessage(workspaceId: string, conversationId: string, message: Message): Promise<void> {
    const db = getDrizzleDatabase();
    const parsed = new Date(message.createdAt);
    const createdAt = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    const senderType = message.senderType === 'bot' ? 'ai' : message.senderType;

    await db.insert(messages).values({
      workspaceId,
      conversationId,
      externalId: message.externalId,
      direction: message.direction,
      senderType,
      senderProfileId: message.senderProfileId,
      senderMembershipId: message.senderMembershipId,
      senderName: message.senderName,
      content: message.content,
      status: message.status ?? 'sent',
      createdAt,
    });

    await db
      .update(conversations)
      .set({ lastMessageAt: createdAt, updatedAt: new Date() })
      .where(and(eq(conversations.workspaceId, workspaceId), eq(conversations.id, conversationId)));
  }

  async changeStatus(workspaceId: string, conversationId: string, status: ConversationStatus): Promise<void> {
    const db = getDrizzleDatabase();
    const now = new Date();
    await db
      .update(conversations)
      .set({ status, statusChangedAt: now, updatedAt: now })
      .where(and(eq(conversations.workspaceId, workspaceId), eq(conversations.id, conversationId)));
  }

  private async mapConversation(row: typeof conversations.$inferSelect): Promise<Conversation> {
    const db = getDrizzleDatabase();
    const [messageRows, labelRows] = await Promise.all([
      db
        .select()
        .from(messages)
        .where(and(eq(messages.workspaceId, row.workspaceId), eq(messages.conversationId, row.id)))
        .orderBy(asc(messages.createdAt)),
      db
        .select({
          id: conversationLabels.id,
          name: conversationLabels.name,
          color: conversationLabels.color,
        })
        .from(conversationLabelAssignments)
        .innerJoin(
          conversationLabels,
          and(
            eq(conversationLabelAssignments.labelId, conversationLabels.id),
            eq(conversationLabelAssignments.workspaceId, conversationLabels.workspaceId),
          ),
        )
        .where(
          and(
            eq(conversationLabelAssignments.workspaceId, row.workspaceId),
            eq(conversationLabelAssignments.conversationId, row.id),
          ),
        )
        .orderBy(asc(conversationLabels.name)),
    ]);

    return {
      id: row.id,
      customerId: row.customerId,
      channel: row.channel === 'webchat' ? 'web' : 'whatsapp',
      status: row.status as ConversationStatus,
      unreadCount: row.unreadCount ?? 0,
      lastMessageAt: row.lastMessageAt?.toISOString() ?? '',
      labels: labelRows.map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color as ConversationLabelColor,
      })),
      messages: messageRows.map((message) => ({
        id: message.id,
        conversationId: message.conversationId,
        externalId: message.externalId ?? undefined,
        content: message.content,
        direction: message.direction as Message['direction'],
        senderType: (message.senderType === 'ai' ? 'bot' : message.senderType) as SenderType,
        senderProfileId: message.senderProfileId ?? undefined,
        senderMembershipId: message.senderMembershipId ?? undefined,
        senderName: message.senderName ?? 'Harmony',
        createdAt: message.createdAt.toISOString(),
        status: ['sent', 'delivered', 'read'].includes(message.status) ? message.status as Message['status'] : 'sent',
      })),
    };
  }
}
