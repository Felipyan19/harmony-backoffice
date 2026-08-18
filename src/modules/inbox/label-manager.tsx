'use client';

import { FormEvent, useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import type { ConversationLabel, ConversationLabelColor } from '@/types/domain';
import { CONVERSATION_LABEL_COLORS } from '@/modules/conversations/domain/conversation-labels';

/** Same product-data exception as conversation-labels.tsx — see globals.css. */
const colorSwatchClasses: Record<ConversationLabelColor, string> = {
  gold: 'bg-label-gold',
  green: 'bg-emerald-500',
  blue: 'bg-sky-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  zinc: 'bg-neutral/40',
};

export function LabelManagerDialog({ labels, counts, onClose, onRename, onRecolor, onDelete, onCreate }: {
  labels: ConversationLabel[];
  counts: Record<string, number>;
  onClose: () => void;
  onRename: (labelId: string, name: string) => void;
  onRecolor: (labelId: string, color: ConversationLabelColor) => void;
  onDelete: (labelId: string) => void;
  onCreate: (name: string) => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newName.trim()) return;
    onCreate(newName);
    setNewName('');
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-neutral/15 bg-white shadow-lg" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral/10 px-5 py-4">
          <div>
            <strong className="block text-base font-semibold text-neutral">Gestionar etiquetas</strong>
            <span className="mt-1 block text-sm text-neutral/40">Cambia el nombre, el color o elimina etiquetas existentes.</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-neutral/40 transition hover:bg-neutral/8 hover:text-neutral/70"><X size={16} /></button>
        </div>

        <div className="max-h-80 overflow-y-auto p-3">
          {labels.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-neutral/40">Todavía no hay etiquetas.</p>
          ) : labels.map((label) => (
            <div key={label.id} className="mb-1.5 rounded-md border border-neutral/10 p-2.5">
              <div className="flex items-center gap-2">
                <input
                  value={label.name}
                  onChange={(event) => onRename(label.id, event.target.value)}
                  maxLength={40}
                  aria-label={`Nombre de la etiqueta ${label.name}`}
                  className="min-w-0 flex-1 rounded-md border border-transparent bg-neutral/4 px-2.5 py-1.5 text-sm font-medium text-neutral outline-none transition focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/12"
                />
                <span className="shrink-0 text-sm font-medium text-neutral/40">{counts[label.id] ?? 0} conv.</span>
                {confirmingId === label.id ? (
                  <>
                    <button type="button" onClick={() => { onDelete(label.id); setConfirmingId(null); }} className="shrink-0 rounded-md bg-danger px-2 py-1.5 text-sm font-semibold text-white transition hover:bg-danger/85">Eliminar</button>
                    <button type="button" onClick={() => setConfirmingId(null)} className="shrink-0 rounded-md px-1.5 py-1.5 text-sm font-medium text-neutral/60 hover:text-neutral">Cancelar</button>
                  </>
                ) : (
                  <button type="button" onClick={() => setConfirmingId(label.id)} aria-label={`Eliminar ${label.name}`} title="Eliminar etiqueta" className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-neutral/40 transition hover:bg-danger/8 hover:text-danger"><Trash2 size={13} /></button>
                )}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                {CONVERSATION_LABEL_COLORS.map((color) => (
                  <button key={color} type="button" onClick={() => onRecolor(label.id, color)} aria-label={`Color ${color}`} title={color} className={`grid h-5 w-5 place-items-center rounded-full ${colorSwatchClasses[color]} ${label.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}>
                    {label.color === color ? <Check size={11} className="text-white" /> : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submitCreate} className="flex gap-2 border-t border-neutral/10 p-3">
          <input value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={40} placeholder="Nueva etiqueta" className="min-w-0 flex-1 rounded-md border border-neutral/15 bg-neutral/4 px-3 text-sm outline-none transition focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/12" />
          <button type="submit" disabled={!newName.trim()} aria-label="Crear etiqueta" className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-white transition hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={15} /></button>
        </form>
      </div>
    </div>
  );
}
