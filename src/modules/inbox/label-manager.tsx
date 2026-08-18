'use client';

import { FormEvent, useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import type { ConversationLabel, ConversationLabelColor } from '@/types/domain';
import { CONVERSATION_LABEL_COLORS } from '@/modules/conversations/domain/conversation-labels';

const colorSwatchClasses: Record<ConversationLabelColor, string> = {
  gold: 'bg-gold-500',
  green: 'bg-emerald-500',
  blue: 'bg-sky-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  zinc: 'bg-zinc-400',
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_30px_80px_rgba(24,60,43,0.25)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <strong className="block text-[13px] font-semibold text-zinc-800">Gestionar etiquetas</strong>
            <span className="mt-1 block text-[9px] text-zinc-400">Cambia el nombre, el color o elimina etiquetas existentes.</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"><X size={16} /></button>
        </div>

        <div className="max-h-80 overflow-y-auto p-3">
          {labels.length === 0 ? (
            <p className="px-2 py-6 text-center text-[10px] text-zinc-400">Todavía no hay etiquetas.</p>
          ) : labels.map((label) => (
            <div key={label.id} className="mb-1.5 rounded-xl border border-zinc-100 p-2.5">
              <div className="flex items-center gap-2">
                <input
                  value={label.name}
                  onChange={(event) => onRename(label.id, event.target.value)}
                  maxLength={40}
                  aria-label={`Nombre de la etiqueta ${label.name}`}
                  className="min-w-0 flex-1 rounded-lg border border-transparent bg-zinc-50 px-2.5 py-1.5 text-[10px] font-medium text-zinc-800 outline-none transition focus:border-harmony-300 focus:bg-white focus:ring-4 focus:ring-harmony-100"
                />
                <span className="shrink-0 text-[8px] font-medium text-zinc-400">{counts[label.id] ?? 0} conv.</span>
                {confirmingId === label.id ? (
                  <>
                    <button type="button" onClick={() => { onDelete(label.id); setConfirmingId(null); }} className="shrink-0 rounded-lg bg-rose-600 px-2 py-1.5 text-[8px] font-semibold text-white transition hover:bg-rose-700">Eliminar</button>
                    <button type="button" onClick={() => setConfirmingId(null)} className="shrink-0 rounded-lg px-1.5 py-1.5 text-[8px] font-medium text-zinc-500 hover:text-zinc-800">Cancelar</button>
                  </>
                ) : (
                  <button type="button" onClick={() => setConfirmingId(label.id)} aria-label={`Eliminar ${label.name}`} title="Eliminar etiqueta" className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"><Trash2 size={13} /></button>
                )}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                {CONVERSATION_LABEL_COLORS.map((color) => (
                  <button key={color} type="button" onClick={() => onRecolor(label.id, color)} aria-label={`Color ${color}`} title={color} className={`grid h-5 w-5 place-items-center rounded-full ${colorSwatchClasses[color]} ${label.color === color ? 'ring-2 ring-offset-2 ring-harmony-700' : ''}`}>
                    {label.color === color ? <Check size={11} className="text-white" /> : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submitCreate} className="flex gap-2 border-t border-zinc-100 p-3">
          <input value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={40} placeholder="Nueva etiqueta" className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[10px] outline-none transition focus:border-harmony-300 focus:bg-white focus:ring-4 focus:ring-harmony-100" />
          <button type="submit" disabled={!newName.trim()} aria-label="Crear etiqueta" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-harmony-700 text-white transition hover:bg-harmony-800 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={15} /></button>
        </form>
      </div>
    </div>
  );
}
