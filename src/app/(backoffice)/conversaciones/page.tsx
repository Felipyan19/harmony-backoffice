import type { Metadata } from 'next';
import { ConversationsPageContent } from '@/components/backoffice-views';

export const metadata: Metadata = { title: 'Conversaciones' };

export default function ConversationsPage() {
  return <ConversationsPageContent />;
}
