'use client';

import { FormEvent, useState } from 'react';
import { Check, Plus, Tag, Tags, X } from 'lucide-react';
import type { ConversationLabel, ConversationLabelColor } from '@/types/domain';

const colorClasses: Record<ConversationLabelColor, string> = {
  gold: 'bg-gold-50 text-gold-700 ring-gold-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  zinc: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
};

const dotClasses: Record<ConversationLabelColor, string> = {
  gold: 'bg-gold-500',
  green: 'bg-emerald-500',
  blue: 'bg-sky-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  zinc: 'bg-zinc-400',
};

export function ConversationLabelDot({ color }: { color: ConversationLabelColor }) {
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClasses[color]}`} />;
}

export function ConversationLabelBadge({ label, compact = false }: { label: ConversationLabel; compact?: boolean }) {
  return (
    <span className={`inline-flex max-w-full items-center rounded-full font-medium ring-1 ring-inset ${compact ? 'px-2 py-0.5 text-[7px]' : 'px-2.5 py-1 text-[9px]'} ${colorClasses[label.color]}`}>
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
      <summary className="flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-[9px] font-medium text-zinc-600 transition hover:bg-zinc-50 [&::-webkit-details-marker]:hidden">
        <Tags size={13} /> Etiquetas
      </summary>
      <div className="absolute right-0 top-11 z-40 w-72 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_18px_55px_rgba(24,60,43,0.16)]">
        <div className="border-b border-zinc-100 px-4 py-3">
          <strong className="block text-[11px] font-semibold text-zinc-800">Etiquetas de la conversación</strong>
          <span className="mt-1 block text-[8px] leading-4 text-zinc-400">Selecciona las que apliquen o crea una nueva.</span>
        </div>
        <div className="max-h-52 overflow-y-auto p-2">
          {labels.length === 0 ? <p className="px-2 py-4 text-center text-[9px] text-zinc-400">Todavía no hay etiquetas.</p> : labels.map((label) => {
            const selected = selectedIds.has(label.id);
            return (
              <button key={label.id} type="button" onClick={() => onToggle(label.id)} className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition ${selected ? 'bg-harmony-50' : 'hover:bg-zinc-50'}`}>
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${selected ? 'border-harmony-600 bg-harmony-700 text-white' : 'border-zinc-200 bg-white text-transparent'}`}><Check size={12} /></span>
                <ConversationLabelBadge label={label} />
              </button>
            );
          })}
        </div>
        <form onSubmit={submit} className="flex gap-2 border-t border-zinc-100 p-3">
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} placeholder="Nueva etiqueta" className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[10px] outline-none transition focus:border-harmony-300 focus:bg-white focus:ring-4 focus:ring-harmony-100" />
          <button type="submit" disabled={!name.trim()} aria-label="Crear etiqueta" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-harmony-700 text-white transition hover:bg-harmony-800 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={15} /></button>
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
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-[9px] font-medium text-zinc-600 transition hover:bg-zinc-50 [&::-webkit-details-marker]:hidden">
        <Tags size={14} className="shrink-0 text-zinc-400" />
        <span className="min-w-0 flex-1 truncate text-left">
          {selectedCount === 0 ? 'Todas las etiquetas' : selectedCount === 1 ? labels.find((label) => label.id === selectedLabelIds[0])?.name ?? 'Todas las etiquetas' : `${selectedCount} etiquetas`}
        </span>
      </summary>
      <div className="absolute left-0 top-11 z-40 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_18px_55px_rgba(24,60,43,0.16)]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <strong className="text-[11px] font-semibold text-zinc-800">Filtrar por etiqueta</strong>
          {selectedCount > 0 ? <button type="button" onClick={onClear} className="text-[8px] font-medium text-harmony-700 hover:underline">Limpiar</button> : null}
        </div>
        <div className="max-h-60 overflow-y-auto p-2">
          {labels.length === 0 ? <p className="px-2 py-4 text-center text-[9px] text-zinc-400">Todavía no hay etiquetas.</p> : labels.map((label) => {
            const selected = selectedLabelIds.includes(label.id);
            return (
              <button key={label.id} type="button" onClick={() => onToggle(label.id)} className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition ${selected ? 'bg-harmony-50' : 'hover:bg-zinc-50'}`}>
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${selected ? 'border-harmony-600 bg-harmony-700 text-white' : 'border-zinc-200 bg-white text-transparent'}`}><Check size={12} /></span>
                <span className="min-w-0 flex-1"><ConversationLabelBadge label={label} /></span>
                <span className="shrink-0 text-[8px] font-medium text-zinc-400">{counts[label.id] ?? 0}</span>
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
    <div className="flex items-center gap-2 border-b border-zinc-100 bg-harmony-50/70 px-3.5 py-2.5">
      <span className="shrink-0 text-[9px] font-semibold text-harmony-800">{selectedCount} seleccionada{selectedCount === 1 ? '' : 's'}</span>
      <details className="relative ml-auto">
        <summary className="flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-harmony-200 bg-white px-2.5 text-[8px] font-medium text-harmony-700 transition hover:bg-harmony-50 [&::-webkit-details-marker]:hidden">
          <Tag size={12} /> Aplicar etiqueta
        </summary>
        <div className="absolute right-0 top-9 z-40 max-h-56 w-56 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_18px_55px_rgba(24,60,43,0.16)]">
          {labels.length === 0 ? <p className="px-2 py-3 text-center text-[9px] text-zinc-400">Todavía no hay etiquetas.</p> : labels.map((label) => (
            <div key={label.id} className="flex items-center gap-1 rounded-xl px-1 py-0.5 hover:bg-zinc-50">
              <button type="button" onClick={() => onApply(label.id)} className="flex-1 truncate rounded-lg px-1.5 py-1.5 text-left" title="Aplicar a las seleccionadas"><ConversationLabelBadge label={label} /></button>
              <button type="button" onClick={() => onRemove(label.id)} aria-label={`Quitar ${label.name} de las seleccionadas`} title="Quitar de las seleccionadas" className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"><X size={12} /></button>
            </div>
          ))}
        </div>
      </details>
      <button type="button" onClick={onClear} className="shrink-0 rounded-lg px-2 py-1.5 text-[8px] font-medium text-zinc-500 hover:text-zinc-800">Cancelar</button>
    </div>
  );
}
