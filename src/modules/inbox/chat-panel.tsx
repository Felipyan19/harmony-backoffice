'use client';

import { FormEvent } from 'react';
import { CheckCheck, MessageCircle, MoreHorizontal, Paperclip, Send, Sparkles } from 'lucide-react';
import type { Conversation, ConversationStatus, Customer } from '@/types/domain';
import { Avatar } from '@/modules/shared/ui';

export function ChatPanel({ conversation, customer, draft, onDraftChange, onSend, onStatusChange }: {
  conversation: Conversation;
  customer: Customer;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (event: FormEvent) => void;
  onStatusChange: (status: ConversationStatus) => void;
}) {
  return (
    <section className="flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_10px_35px_rgba(24,60,43,0.05)] xl:min-h-0">
      <header className="flex h-[74px] shrink-0 items-center justify-between gap-3 border-b border-zinc-100 px-4 md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={customer.name} size="lg" />
          <div className="min-w-0">
            <strong className="block truncate text-[13px] font-semibold">{customer.name}</strong>
            <span className="mt-1 block truncate text-[9px] text-zinc-400">{customer.phone} · WhatsApp</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={conversation.status} onChange={(event) => onStatusChange(event.target.value as ConversationStatus)} aria-label="Estado de conversación" className="h-9 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[10px] font-medium text-zinc-700 outline-none transition focus:border-harmony-300 focus:ring-4 focus:ring-harmony-100">
            <option value="open">Abierta</option>
            <option value="pending">Pendiente</option>
            <option value="resolved">Resuelta</option>
          </select>
          <button className="grid h-9 w-9 place-items-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" aria-label="Más opciones"><MoreHorizontal size={18} /></button>
        </div>
      </header>

      <div className="relative flex-1 overflow-y-auto bg-[#fafaf7] px-4 py-5 md:px-6">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#d8ded9_0.8px,transparent_0.8px)] [background-size:18px_18px]" />
        <div className="relative mx-auto max-w-4xl">
          <div className="mb-5 flex justify-center"><span className="rounded-full bg-white px-3 py-1 text-[9px] font-medium text-zinc-400 shadow-sm ring-1 ring-zinc-200/70">Hoy</span></div>
          {conversation.messages.map((message) => {
            const outgoing = message.direction === 'outgoing';
            const bubbleClass = message.senderType === 'bot'
              ? 'rounded-br-md bg-harmony-100/80 text-harmony-900 ring-harmony-200'
              : outgoing
                ? 'rounded-br-md bg-gold-50 text-zinc-800 ring-gold-200'
                : 'rounded-bl-md bg-white text-zinc-800 ring-zinc-200';
            return (
              <div key={message.id} className={`mb-3 flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-[0_6px_18px_rgba(24,60,43,0.05)] ring-1 ring-inset md:max-w-[70%] ${bubbleClass}`}>
                  {message.senderType !== 'customer' && <div className="mb-1.5 text-[9px] font-semibold text-harmony-700">{message.senderType === 'bot' ? 'Harmony IA' : message.senderName}</div>}
                  <p className="m-0 text-[11px] leading-[1.65]">{message.content}</p>
                  <div className="mt-1.5 flex items-center justify-end gap-1 text-[8px] text-zinc-400">
                    <span>{message.createdAt}</span>{outgoing && <CheckCheck size={13} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={onSend} className="shrink-0 border-t border-zinc-100 bg-white p-3.5">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/60 transition focus-within:border-harmony-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-harmony-100/60">
          <div className="flex items-center gap-5 border-b border-zinc-100 px-4 py-2.5 text-[9px] font-medium text-zinc-500">
            <span className="flex items-center gap-1.5 border-b-2 border-harmony-700 pb-2 text-harmony-700"><MessageCircle size={13} /> Responder</span>
            <span className="flex items-center gap-1.5 pb-2"><Sparkles size={13} /> Atención Harmony</span>
          </div>
          <textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="Escribe un mensaje..." rows={3} className="min-h-20 w-full resize-none bg-transparent px-4 py-3 text-[11px] leading-5 text-zinc-800 outline-none placeholder:text-zinc-400" />
          <div className="flex items-center justify-between px-3 pb-3">
            <button type="button" className="grid h-9 w-9 place-items-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" aria-label="Adjuntar archivo"><Paperclip size={16} /></button>
            <button type="submit" disabled={!draft.trim()} className="flex h-9 items-center gap-2 rounded-xl bg-harmony-700 px-4 text-[10px] font-semibold text-white shadow-sm shadow-harmony-900/10 transition hover:bg-harmony-800 disabled:cursor-not-allowed disabled:opacity-40"><Send size={14} /> Enviar</button>
          </div>
        </div>
      </form>
    </section>
  );
}
