import type { Metadata } from 'next';
import { CustomersPageContent } from '@/components/backoffice-views';

export const metadata: Metadata = { title: 'Clientes' };

export default function CustomersPage() {
  return <CustomersPageContent />;
}
