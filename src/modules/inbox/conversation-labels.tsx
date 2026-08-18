'use client';

import { FormEvent, useState } from 'react';
import { Check, Plus, Settings2, Tag, Tags, X } from 'lucide-react';
import type { ConversationLabel } from '@/types/domain';
import { Badge, IconButton, Popover, TextField } from '@/modules/shared/ui';

export function ConversationLabelBadge({ label, compact = false }: { label: ConversationLabel; compact?: boolean }) {
  return <Badge tone={label.color} compact={compact}>{label.name}</Badge>;
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
    <Popover
      align="right"
      panelClassName="top-11 w-72"
      renderTrigger={({ open, onClick }) => (
        <button type="button" onClick={onClick} aria-haspopup="true" aria-expanded={open} className="flex h-9 items-center gap-1.5 rounded-md border border-neutral/15 bg-white px-3 text-sm font-medium text-neutral/70 transition hover:bg-neutral/5">
          <Tags size={13} /> Etiquetas
        </button>
      )}
    >
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
        <TextField value={name} onChange={(event) => setName(event.target.value)} maxLength={40} placeholder="Nueva etiqueta" containerClassName="min-w-0 flex-1" />
        <IconButton type="submit" disabled={!name.trim()} variant="primary" aria-label="Crear etiqueta"><Plus size={15} /></IconButton>
      </form>
    </Popover>
  );
}

export function ConversationLabelFilterMenu({ labels, counts, selectedLabelIds, onToggle, onClear, onManageLabels }: {
  labels: ConversationLabel[];
  counts: Record<string, number>;
  selectedLabelIds: string[];
  onToggle: (labelId: string) => void;
  onClear: () => void;
  onManageLabels: () => void;
}) {
  const selectedCount = selectedLabelIds.length;

  return (
    <Popover
      align="left"
      panelClassName="top-11 w-64"
      containerClassName="min-w-0 flex-1"
      renderTrigger={({ open, onClick }) => (
        <button type="button" onClick={onClick} aria-haspopup="true" aria-expanded={open} className="flex h-9 w-full min-w-0 items-center gap-1.5 rounded-md border border-neutral/15 bg-white px-2 text-[11px] font-medium text-neutral/70 transition hover:bg-neutral/5">
          <Tags size={14} className="shrink-0 text-neutral/40" />
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedCount === 0 ? 'Todas las etiquetas' : selectedCount === 1 ? labels.find((label) => label.id === selectedLabelIds[0])?.name ?? 'Todas las etiquetas' : `${selectedCount} etiquetas`}
          </span>
        </button>
      )}
    >
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
      <button type="button" onClick={onManageLabels} className="flex w-full items-center gap-2 border-t border-neutral/10 px-4 py-2.5 text-left text-sm font-medium text-neutral/70 transition hover:bg-neutral/5 hover:text-neutral">
        <Settings2 size={14} className="shrink-0 text-neutral/40" /> Gestionar etiquetas
      </button>
    </Popover>
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
      <Popover
        align="right"
        panelClassName="top-9 w-56"
        containerClassName="ml-auto"
        renderTrigger={({ open, onClick }) => (
          <button type="button" onClick={onClick} aria-haspopup="true" aria-expanded={open} className="flex h-8 items-center gap-1.5 rounded-md border border-primary/25 bg-white px-2.5 text-sm font-medium text-primary transition hover:bg-primary/8">
            <Tag size={12} /> Aplicar etiqueta
          </button>
        )}
      >
        <div className="max-h-56 overflow-y-auto p-2">
          {labels.length === 0 ? <p className="px-2 py-3 text-center text-sm text-neutral/40">Todavía no hay etiquetas.</p> : labels.map((label) => (
            <div key={label.id} className="flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-neutral/5">
              <button type="button" onClick={() => onApply(label.id)} className="flex-1 truncate rounded-md px-1.5 py-1.5 text-left" title="Aplicar a las seleccionadas"><ConversationLabelBadge label={label} /></button>
              <button type="button" onClick={() => onRemove(label.id)} aria-label={`Quitar ${label.name} de las seleccionadas`} title="Quitar de las seleccionadas" className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-neutral/40 transition hover:bg-danger/8 hover:text-danger"><X size={12} /></button>
            </div>
          ))}
        </div>
      </Popover>
      <button type="button" onClick={onClear} className="shrink-0 rounded-md px-2 py-1.5 text-sm font-medium text-neutral/60 hover:text-neutral">Cancelar</button>
    </div>
  );
}
