export type Channel = 'whatsapp' | 'web';
export type ConversationStatus = 'open' | 'pending' | 'resolved';
export type MessageDirection = 'incoming' | 'outgoing';
export type SenderType = 'customer' | 'agent' | 'bot';
export type ConversationLabelColor = 'gold' | 'green' | 'blue' | 'rose' | 'violet' | 'zinc';

export interface ConversationLabel {
  id: string;
  name: string;
  color: ConversationLabelColor;
}

export interface Message {
  id: string;
  conversationId: string;
  externalId?: string;
  content: string;
  direction: MessageDirection;
  senderType: SenderType;
  senderProfileId?: string;
  senderMembershipId?: string;
  senderName: string;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  customerId: string;
  channel: Channel;
  status: ConversationStatus;
  unreadCount: number;
  assignedTo?: string;
  lastMessageAt: string;
  labels: ConversationLabel[];
  messages: Message[];
}
