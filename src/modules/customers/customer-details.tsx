import { ChevronRight, UserRound } from 'lucide-react';
import type { Conversation, Customer } from '@/types/domain';
import { Avatar, Badge } from '@/modules/shared/ui';

export function CustomerDetails({ customer, conversation, onOpenCustomers, compact = false }: {
  customer: Customer;
  conversation?: Conversation;
  onOpenCustomers?: () => void;
  compact?: boolean;
}) {
  return (
    <aside className={`${compact ? 'block' : 'hidden xl:block'} overflow-y-auto rounded-lg border border-neutral/15 bg-white`}>
      <div className="border-b border-neutral/10 px-5 py-6 text-center">
        <div className="mx-auto w-fit"><Avatar name={customer.name} size="xl" /></div>
        <strong className="mt-3 block text-base font-semibold">{customer.name}</strong>
        <span className="mt-1 block text-sm text-neutral/40">{customer.phone}</span>
      </div>
      <section className="border-b border-neutral/10 px-5 py-4">
        <h3 className="mb-3 text-base font-semibold text-neutral">Información</h3>
        <dl className="space-y-3.5">
          <Info label="Correo" value={customer.email ?? 'Sin registrar'} />
          <Info label="Cliente desde" value={customer.createdAt} />
          <Info label="Última actividad" value={customer.lastSeen} />
          <Info label="Canal" value="WhatsApp" />
        </dl>
      </section>
      <section className="border-b border-neutral/10 px-5 py-4">
        <h3 className="mb-3 text-base font-semibold text-neutral">Etiquetas</h3>
        <div className="flex flex-wrap gap-1.5">{customer.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>
      </section>
      <section className="border-b border-neutral/10 px-5 py-4">
        <h3 className="mb-3 text-base font-semibold text-neutral">Notas internas</h3>
        <p className="m-0 text-sm leading-4 text-neutral/60">{customer.notes ?? 'Sin notas internas todavía.'}</p>
      </section>
      {conversation && <div className="flex items-center gap-3 border-b border-neutral/10 px-5 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><UserRound size={16} /></div>
        <div className="min-w-0 flex-1"><span className="block text-sm text-neutral/40">Asignado a</span><strong className="mt-1 block truncate text-sm font-semibold">{conversation.assignedTo ?? 'Sin asignar'}</strong></div>
      </div>}
      {!compact && onOpenCustomers && <button onClick={onOpenCustomers} className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-primary transition hover:bg-primary/8">Ver ficha completa del cliente <ChevronRight size={15} /></button>}
    </aside>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-sm text-neutral/40">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-neutral/80">{value}</dd></div>;
}
