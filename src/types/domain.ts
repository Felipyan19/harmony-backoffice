export type Channel = "whatsapp" | "web";
export type ConversationStatus = "open" | "pending" | "resolved";
export type MessageDirection = "incoming" | "outgoing";
export type SenderType = "customer" | "agent" | "bot";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  tags: string[];
  lastSeen: string;
  createdAt: string;
  notes?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  direction: MessageDirection;
  senderType: SenderType;
  senderName: string;
  createdAt: string;
  status?: "sent" | "delivered" | "read";
}

export interface Conversation {
  id: string;
  customerId: string;
  channel: Channel;
  status: ConversationStatus;
  unreadCount: number;
  assignedTo?: string;
  lastMessageAt: string;
  messages: Message[];
}
