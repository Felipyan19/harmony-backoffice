import type { Metadata } from 'next';
import { DashboardPageContent } from '@/components/dashboard-view';

export const metadata: Metadata = { title: 'Inicio' };

export default function DashboardPage() {
  return <DashboardPageContent />;
}
