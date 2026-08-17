import { ChevronRight, UserRound } from 'lucide-react';
import type { Conversation, Customer } from '@/types/domain';
import { Avatar } from '@/modules/shared/ui';

export function CustomerDetails({ customer, conversation, onOpenCustomers, compact = false }: {
  customer: Customer;
  conversation?: Conversation;
  onOpenCustomers?: () => void;
  compact?: boolean;
}) {
  return (
    <aside className={`${compact ? 'block' : 'hidden xl:block'} overflow-y-auto rounded-2xl border border-zinc-200/80 bg-white shadow-[0_10px_35px_rgba(24,60,43,0.05)]`}>
      <div className="border-b border-zinc-100 px-5 py-6 text-center">
        <div className="mx-auto w-fit"><Avatar name={customer.name} size="xl" /></div>
        <strong className="mt-3 block text-[13px] font-semibold">{customer.name}</strong>
        <span className="mt-1 block text-[9px] text-zinc-400">{customer.phone}</span>
      </div>
      <section className="border-b border-zinc-100 px-5 py-4">
        <h3 className="mb-3 text-[10px] font-semibold text-zinc-800">Información</h3>
        <dl className="space-y-3.5">
          <Info label="Correo" value={customer.email ?? 'Sin registrar'} />
          <Info label="Cliente desde" value={customer.createdAt} />
          <Info label="Última actividad" value={customer.lastSeen} />
          <Info label="Canal" value="WhatsApp" />
        </dl>
      </section>
      <section className="border-b border-zinc-100 px-5 py-4">
        <h3 className="mb-3 text-[10px] font-semibold text-zinc-800">Etiquetas</h3>
        <div className="flex flex-wrap gap-1.5">{customer.tags.map((tag) => <span key={tag} className="rounded-full bg-gold-50 px-2.5 py-1.5 text-[8px] font-medium text-gold-700 ring-1 ring-inset ring-gold-200">{tag}</span>)}</div>
      </section>
      <section className="border-b border-zinc-100 px-5 py-4">
        <h3 className="mb-3 text-[10px] font-semibold text-zinc-800">Notas internas</h3>
        <p className="m-0 text-[9px] leading-4 text-zinc-500">{customer.notes ?? 'Sin notas internas todavía.'}</p>
      </section>
      {conversation && <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-harmony-50 text-harmony-700"><UserRound size={16} /></div>
        <div className="min-w-0 flex-1"><span className="block text-[8px] text-zinc-400">Asignado a</span><strong className="mt-1 block truncate text-[10px] font-semibold">{conversation.assignedTo ?? 'Sin asignar'}</strong></div>
      </div>}
      {!compact && onOpenCustomers && <button onClick={onOpenCustomers} className="flex w-full items-center justify-between px-5 py-4 text-[9px] font-semibold text-harmony-700 transition hover:bg-harmony-50">Ver ficha completa del cliente <ChevronRight size={15} /></button>}
    </aside>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[8px] text-zinc-400">{label}</dt><dd className="mt-1 break-words text-[9px] font-medium text-zinc-700">{value}</dd></div>;
}
