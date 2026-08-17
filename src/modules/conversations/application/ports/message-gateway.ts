export interface OutgoingMessage {
  conversationId: string;
  recipient: string;
  content: string;
}

export interface MessageGateway {
  send(message: OutgoingMessage): Promise<{ externalId?: string }>;
}
