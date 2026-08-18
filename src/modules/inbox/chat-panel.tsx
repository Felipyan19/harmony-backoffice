'use client';

import { FormEvent } from 'react';
import { CheckCheck, MessageCircle, MoreHorizontal, Paperclip, Send, Sparkles } from 'lucide-react';
import type { Conversation, ConversationLabel, ConversationStatus, Customer } from '@/types/domain';
import { Avatar, Button, IconButton, Panel } from '@/modules/shared/ui';
import { ConversationLabelBadge, ConversationLabelEditor } from './conversation-labels';

export function ChatPanel({ conversation, customer, labels, draft, onDraftChange, onSend, onStatusChange, onToggleLabel, onCreateLabel }: {
  conversation: Conversation;
  customer: Customer;
  labels: ConversationLabel[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (event: FormEvent) => void;
  onStatusChange: (status: ConversationStatus) => void;
  onToggleLabel: (labelId: string) => void;
  onCreateLabel: (name: string) => void;
}) {
  return (
    <Panel className="flex min-h-[620px] min-w-0 flex-col overflow-hidden xl:min-h-0">
      <header className="shrink-0 border-b border-neutral/10 px-4 py-3 md:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={customer.name} size="lg" />
            <div className="min-w-0">
              <strong className="block truncate text-base font-semibold">{customer.name}</strong>
              <span className="mt-1 block truncate text-sm text-neutral/40">{customer.phone} · WhatsApp</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ConversationLabelEditor labels={labels} selectedLabels={conversation.labels} onToggle={onToggleLabel} onCreate={onCreateLabel} />
            <select value={conversation.status} onChange={(event) => onStatusChange(event.target.value as ConversationStatus)} aria-label="Estado de conversación" className="h-9 rounded-md border border-neutral/15 bg-neutral/4 px-3 text-sm font-medium text-neutral/80 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/12">
              <option value="open">Abierta</option>
              <option value="pending">Pendiente</option>
              <option value="resolved">Resuelta</option>
            </select>
            <IconButton className="hidden sm:grid" aria-label="Más opciones"><MoreHorizontal size={18} /></IconButton>
          </div>
        </div>
        {conversation.labels.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5 pl-12 md:pl-14">
            {conversation.labels.map((label) => <ConversationLabelBadge key={label.id} label={label} />)}
          </div>
        ) : null}
      </header>

      <div className="relative flex-1 overflow-y-auto bg-neutral/3 px-4 py-5 md:px-6">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#d8ded9_0.8px,transparent_0.8px)] [background-size:18px_18px]" />
        <div className="relative mx-auto max-w-4xl">
          <div className="mb-5 flex justify-center"><span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-neutral/40 ring-1 ring-neutral/12">Hoy</span></div>
          {conversation.messages.map((message) => {
            const outgoing = message.direction === 'outgoing';
            const bubbleClass = message.senderType === 'bot'
              ? 'rounded-br-md bg-primary/10 text-neutral ring-primary/20'
              : outgoing
                ? 'rounded-br-md bg-neutral/5 text-neutral ring-neutral/12'
                : 'rounded-bl-md bg-white text-neutral ring-neutral/12';
            return (
              <div key={message.id} className={`mb-3 flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-lg px-4 py-3 ring-1 ring-inset md:max-w-[70%] ${bubbleClass}`}>
                  {message.senderType !== 'customer' && <div className="mb-1.5 text-sm font-semibold text-primary">{message.senderType === 'bot' ? 'Harmony IA' : message.senderName}</div>}
                  <p className="m-0 text-base leading-[1.65]">{message.content}</p>
                  <div className="mt-1.5 flex items-center justify-end gap-1 text-sm text-neutral/40">
                    <span>{message.createdAt}</span>{outgoing && <CheckCheck size={13} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={onSend} className="shrink-0 border-t border-neutral/10 bg-white p-3.5">
        <div className="overflow-hidden rounded-lg border border-neutral/15 bg-neutral/4 transition focus-within:border-primary/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/12">
          <div className="flex items-center gap-5 border-b border-neutral/10 px-4 py-2.5 text-sm font-medium text-neutral/60">
            <span className="flex items-center gap-1.5 border-b-2 border-primary pb-2 text-primary"><MessageCircle size={13} /> Responder</span>
            <span className="flex items-center gap-1.5 pb-2"><Sparkles size={13} /> Atención Harmony</span>
          </div>
          <textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="Escribe un mensaje..." rows={3} className="min-h-20 w-full resize-none bg-transparent px-4 py-3 text-base leading-5 text-neutral outline-none placeholder:text-neutral/40" />
          <div className="flex items-center justify-between px-3 pb-3">
            <IconButton type="button" aria-label="Adjuntar archivo"><Paperclip size={16} /></IconButton>
            <Button type="submit" disabled={!draft.trim()}><Send size={14} /> Enviar</Button>
          </div>
        </div>
      </form>
    </Panel>
  );
}
