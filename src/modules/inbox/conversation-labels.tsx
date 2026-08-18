'use client';

import { FormEvent, useState } from 'react';
import { Check, Plus, Tag, Tags, X } from 'lucide-react';
import type { ConversationLabel, ConversationLabelColor } from '@/types/domain';

/**
 * User-assignable label colors — product data, not app chrome, so this is
 * the one place allowed to reach beyond the primary/neutral/warning/danger
 * tokens (see globals.css). Everything else here follows the design system.
 */
const colorClasses: Record<ConversationLabelColor, string> = {
  gold: 'bg-label-gold/10 text-label-gold ring-label-gold/25',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  zinc: 'bg-neutral/8 text-neutral/60 ring-neutral/15',
};

const dotClasses: Record<ConversationLabelColor, string> = {
  gold: 'bg-label-gold',
  green: 'bg-emerald-500',
  blue: 'bg-sky-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  zinc: 'bg-neutral/40',
};

export function ConversationLabelDot({ color }: { color: ConversationLabelColor }) {
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClasses[color]}`} />;
}

export function ConversationLabelBadge({ label, compact = false }: { label: ConversationLabel; compact?: boolean }) {
  return (
    <span className={`inline-flex max-w-full items-center rounded-full font-medium ring-1 ring-inset text-sm ${compact ? 'px-2 py-0.5' : 'px-2.5 py-1'} ${colorClasses[label.color]}`}>
      <span className="truncate">{label.name}</span>
    </span>
  );
}

export function ConversationLabelEditor({ labels, selectedLabels, onToggle, onCreate }: {
  labels: ConversationLabel[];
  selectedLabels: ConversationLabel[];
  onToggle: (labelId: string) => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const selectedIds = new Set(selectedLabels.map((label) => label.id));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    onCreate(name);
    setName('');
  }

  return (
    <details className="relative">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-md border border-neutral/15 bg-white px-3 text-sm font-medium text-neutral/70 transition hover:bg-neutral/5 [&::-webkit-details-marker]:hidden">
        <Tags size={13} /> Etiquetas
      </summary>
      <div className="absolute right-0 top-11 z-40 w-72 overflow-hidden rounded-lg border border-neutral/15 bg-white shadow-lg">
        <div className="border-b border-neutral/10 px-4 py-3">
          <strong className="block text-base font-semibold text-neutral">Etiquetas de la conversación</strong>
          <span className="mt-1 block text-sm leading-4 text-neutral/40">Selecciona las que apliquen o crea una nueva.</span>
        </div>
        <div className="max-h-52 overflow-y-auto p-2">
          {labels.length === 0 ? <p className="px-2 py-4 text-center text-sm text-neutral/40">Todavía no hay etiquetas.</p> : labels.map((label) => {
            const selected = selectedIds.has(label.id);
            return (
              <button key={label.id} type="button" onClick={() => onToggle(label.id)} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition ${selected ? 'bg-primary/8' : 'hover:bg-neutral/5'}`}>
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${selected ? 'border-primary bg-primary text-white' : 'border-neutral/15 bg-white text-transparent'}`}><Check size={12} /></span>
                <ConversationLabelBadge label={label} />
              </button>
            );
          })}
        </div>
        <form onSubmit={submit} className="flex gap-2 border-t border-neutral/10 p-3">
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} placeholder="Nueva etiqueta" className="min-w-0 flex-1 rounded-md border border-neutral/15 bg-neutral/4 px-3 text-sm outline-none transition focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/12" />
          <button type="submit" disabled={!name.trim()} aria-label="Crear etiqueta" className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-white transition hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={15} /></button>
        </form>
      </div>
    </details>
  );
}

export function ConversationLabelFilterMenu({ labels, counts, selectedLabelIds, onToggle, onClear }: {
  labels: ConversationLabel[];
  counts: Record<string, number>;
  selectedLabelIds: string[];
  onToggle: (labelId: string) => void;
  onClear: () => void;
}) {
  const selectedCount = selectedLabelIds.length;

  return (
    <details className="relative">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-md border border-neutral/15 bg-white px-3 text-sm font-medium text-neutral/70 transition hover:bg-neutral/5 [&::-webkit-details-marker]:hidden">
        <Tags size={14} className="shrink-0 text-neutral/40" />
        <span className="min-w-0 flex-1 truncate text-left">
          {selectedCount === 0 ? 'Todas las etiquetas' : selectedCount === 1 ? labels.find((label) => label.id === selectedLabelIds[0])?.name ?? 'Todas las etiquetas' : `${selectedCount} etiquetas`}
        </span>
      </summary>
      <div className="absolute left-0 top-11 z-40 w-64 overflow-hidden rounded-lg border border-neutral/15 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-neutral/10 px-4 py-3">
          <strong className="text-base font-semibold text-neutral">Filtrar por etiqueta</strong>
          {selectedCount > 0 ? <button type="button" onClick={onClear} className="text-sm font-medium text-primary hover:underline">Limpiar</button> : null}
        </div>
        <div className="max-h-60 overflow-y-auto p-2">
          {labels.length === 0 ? <p className="px-2 py-4 text-center text-sm text-neutral/40">Todavía no hay etiquetas.</p> : labels.map((label) => {
            const selected = selectedLabelIds.includes(label.id);
            return (
              <button key={label.id} type="button" onClick={() => onToggle(label.id)} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition ${selected ? 'bg-primary/8' : 'hover:bg-neutral/5'}`}>
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${selected ? 'border-primary bg-primary text-white' : 'border-neutral/15 bg-white text-transparent'}`}><Check size={12} /></span>
                <span className="min-w-0 flex-1"><ConversationLabelBadge label={label} /></span>
                <span className="shrink-0 text-sm font-medium text-neutral/40">{counts[label.id] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
}

export function ConversationLabelBulkBar({ labels, selectedCount, onApply, onRemove, onClear }: {
  labels: ConversationLabel[];
  selectedCount: number;
  onApply: (labelId: string) => void;
  onRemove: (labelId: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-neutral/10 bg-primary/6 px-3.5 py-2.5">
      <span className="shrink-0 text-sm font-semibold text-primary">{selectedCount} seleccionada{selectedCount === 1 ? '' : 's'}</span>
      <details className="relative ml-auto">
        <summary className="flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-md border border-primary/25 bg-white px-2.5 text-sm font-medium text-primary transition hover:bg-primary/8 [&::-webkit-details-marker]:hidden">
          <Tag size={12} /> Aplicar etiqueta
        </summary>
        <div className="absolute right-0 top-9 z-40 max-h-56 w-56 overflow-y-auto rounded-lg border border-neutral/15 bg-white p-2 shadow-lg">
          {labels.length === 0 ? <p className="px-2 py-3 text-center text-sm text-neutral/40">Todavía no hay etiquetas.</p> : labels.map((label) => (
            <div key={label.id} className="flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-neutral/5">
              <button type="button" onClick={() => onApply(label.id)} className="flex-1 truncate rounded-md px-1.5 py-1.5 text-left" title="Aplicar a las seleccionadas"><ConversationLabelBadge label={label} /></button>
              <button type="button" onClick={() => onRemove(label.id)} aria-label={`Quitar ${label.name} de las seleccionadas`} title="Quitar de las seleccionadas" className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-neutral/40 transition hover:bg-danger/8 hover:text-danger"><X size={12} /></button>
            </div>
          ))}
        </div>
      </details>
      <button type="button" onClick={onClear} className="shrink-0 rounded-md px-2 py-1.5 text-sm font-medium text-neutral/60 hover:text-neutral">Cancelar</button>
    </div>
  );
}
