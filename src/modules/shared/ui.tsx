import { Search } from 'lucide-react';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import type { ConversationStatus } from '@/types/domain';

export const statusLabel: Record<ConversationStatus, string> = {
  open: 'Abierta',
  pending: 'Pendiente',
  resolved: 'Resuelta',
};

const statusClass: Record<ConversationStatus, string> = {
  open: 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/25',
  pending: 'bg-warning/10 text-warning ring-1 ring-inset ring-warning/25',
  resolved: 'bg-neutral/8 text-neutral/60 ring-1 ring-inset ring-neutral/15',
};

export function initials(name: string) {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' | 'xl' }) {
  const sizes = {
    md: 'h-10 w-10 text-sm',
    lg: 'h-11 w-11 text-sm',
    xl: 'h-16 w-16 text-lg',
  };
  return <div className={`grid shrink-0 place-items-center rounded-full bg-primary font-semibold text-white ${sizes[size]}`}>{initials(name)}</div>;
}

export function StatusBadge({ status }: { status: ConversationStatus }) {
  return <span className={`rounded-full px-2 py-1 text-sm font-semibold ${statusClass[status]}`}>{statusLabel[status]}</span>;
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="flex h-10 items-center gap-2.5 rounded-md border border-neutral/15 bg-neutral/4 px-3.5 text-neutral/40 transition focus-within:border-primary/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/12">
      <Search size={16} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-base text-neutral outline-none placeholder:text-neutral/40" />
    </label>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid flex-1 place-items-center px-8 py-16 text-center">
      <div>
        <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">H</div>
        <h3 className="text-base font-semibold text-neutral">{title}</h3>
        <p className="mx-auto mt-1.5 max-w-64 text-sm leading-4 text-neutral/40">{description}</p>
      </div>
    </div>
  );
}

/** Flat, bordered surface used for panels, cards and dialogs across the app. */
export function Panel({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-lg border border-neutral/15 bg-white ${className}`} {...props} />;
}

/** Low-emphasis text chip. Used for free-form tags (e.g. customer tags). */
export function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-neutral/6 px-2.5 py-1 text-sm font-medium text-neutral/70 ring-1 ring-inset ring-neutral/12">{children}</span>;
}

type ButtonVariant = 'primary' | 'neutral' | 'danger' | 'ghost';

const buttonVariantClass: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary/85 disabled:bg-primary/40',
  neutral: 'border border-neutral/15 bg-white text-neutral/70 hover:bg-neutral/5 disabled:text-neutral/30',
  danger: 'border border-danger/25 bg-white text-danger hover:bg-danger/8 disabled:opacity-40',
  ghost: 'text-neutral/40 hover:bg-neutral/8 hover:text-neutral/70 disabled:opacity-40',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed ${buttonVariantClass[variant]} ${className}`}
      {...props}
    />
  );
}

/** Square icon-only button — toolbar actions, close/delete affordances. */
export function IconButton({ variant = 'ghost', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-md transition disabled:cursor-not-allowed ${buttonVariantClass[variant]} ${className}`}
      {...props}
    />
  );
}
