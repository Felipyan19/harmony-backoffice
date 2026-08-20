import type { Metadata } from 'next';
import { MessageCircle, Users } from 'lucide-react';
import { DashboardPageContent } from '@/components/dashboard-view';
import { getCurrentWorkspaceContext } from '@/lib/dal/auth';
import { Panel } from '@/modules/shared/ui';

export const metadata: Metadata = { title: 'Inicio' };

export default async function DashboardPage() {
  const workspace = await getCurrentWorkspaceContext();
  if (workspace.current.slug === 'harmony') return <DashboardPageContent />;

  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-7">
      <div className="mx-auto max-w-5xl">
        <Panel className="p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><MessageCircle size={21} /></div>
          <h2 className="mt-4 text-lg font-semibold">{workspace.current.name} está listo</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-neutral/55">Este backoffice ya está aislado del resto de negocios. Cuando conectes sus canales, clientes y conversaciones, el resumen operativo se construirá con sus propios datos.</p>
          <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-5 text-sm text-neutral/45">
            <span className="flex items-center gap-1.5"><Users size={14} />Clientes propios</span>
            <span className="flex items-center gap-1.5"><MessageCircle size={14} />Conversaciones propias</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
