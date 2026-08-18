import type { ReactNode } from 'react';
import type { ConversationLabelColor, ConversationStatus } from '@/types/domain';

/**
 * Badge tones cover the 4 app-chrome colors (primary/warning/neutral/danger)
 * plus the 6 user-assignable conversation label colors — see the
 * --color-label-gold exception documented in globals.css. `zinc` (a label
 * color) and `neutral` (the generic tone) intentionally resolve to the same
 * look; that's by design, not a duplicate to dedupe further.
 */
export type BadgeTone = 'primary' | 'warning' | 'neutral' | 'danger' | ConversationLabelColor;

const toneClass: Record<BadgeTone, string> = {
  primary: 'bg-primary/10 text-primary ring-primary/25',
  warning: 'bg-warning/10 text-warning ring-warning/25',
  neutral: 'bg-neutral/8 text-neutral/60 ring-neutral/15',
  danger: 'bg-danger/10 text-danger ring-danger/25',
  gold: 'bg-label-gold/10 text-label-gold ring-label-gold/25',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  zinc: 'bg-neutral/8 text-neutral/60 ring-neutral/15',
};

/** Generic rounded chip — free-form tags, conversation labels, status pills all go through this. */
export function Badge({ tone = 'neutral', compact = false, className = '', children }: {
  tone?: BadgeTone;
  compact?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`inline-flex max-w-full items-center rounded-full font-medium ring-1 ring-inset text-sm ${compact ? 'px-2 py-0.5' : 'px-2.5 py-1'} ${toneClass[tone]} ${className}`}>
      <span className="truncate">{children}</span>
    </span>
  );
}

export const statusLabel: Record<ConversationStatus, string> = {
  open: 'Abierta',
  pending: 'Pendiente',
  resolved: 'Resuelta',
};

const statusTone: Record<ConversationStatus, BadgeTone> = {
  open: 'primary',
  pending: 'warning',
  resolved: 'neutral',
};

export function StatusBadge({ status }: { status: ConversationStatus }) {
  return <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge>;
}

/** Small solid-filled counter pill — nav badges, unread counts. Renders nothing for count <= 0. */
export function CountBadge({ count, tone = 'primary', className = '' }: { count: number; tone?: 'primary' | 'gold'; className?: string }) {
  if (count <= 0) return null;
  const toneClass = tone === 'gold' ? 'bg-label-gold' : 'bg-primary';
  return <span className={`grid h-[18px] min-w-[18px] place-items-center rounded-full ${toneClass} px-1.5 text-sm font-bold text-white ${className}`}>{count}</span>;
}

/** Solid single-color swatch — used by the label color picker, not a Badge (it's a button, not a display chip). */
export const labelColorSwatchClass: Record<ConversationLabelColor, string> = {
  gold: 'bg-label-gold',
  green: 'bg-emerald-500',
  blue: 'bg-sky-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  zinc: 'bg-neutral/40',
};
