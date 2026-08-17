import { Search } from 'lucide-react';
import type { ConversationStatus } from '@/types/domain';

export const statusLabel: Record<ConversationStatus, string> = {
  open: 'Abierta',
  pending: 'Pendiente',
  resolved: 'Resuelta',
};

const statusClass: Record<ConversationStatus, string> = {
  open: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  resolved: 'bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200',
};

export function initials(name: string) {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' | 'xl' }) {
  const sizes = {
    md: 'h-10 w-10 text-[10px]',
    lg: 'h-11 w-11 text-[11px]',
    xl: 'h-16 w-16 text-base',
  };
  return <div className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-harmony-600 to-harmony-800 font-semibold text-white shadow-sm ${sizes[size]}`}>{initials(name)}</div>;
}

export function StatusBadge({ status }: { status: ConversationStatus }) {
  return <span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${statusClass[status]}`}>{statusLabel[status]}</span>;
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="flex h-11 items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3.5 text-zinc-400 transition focus-within:border-harmony-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-harmony-100/70">
      <Search size={16} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[12px] text-zinc-800 outline-none placeholder:text-zinc-400" />
    </label>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid flex-1 place-items-center px-8 py-16 text-center">
      <div>
        <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-harmony-50 text-harmony-700">H</div>
        <h3 className="text-sm font-semibold text-zinc-800">{title}</h3>
        <p className="mx-auto mt-1.5 max-w-64 text-[10px] leading-4 text-zinc-400">{description}</p>
      </div>
    </div>
  );
}
