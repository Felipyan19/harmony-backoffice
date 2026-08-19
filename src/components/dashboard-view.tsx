'use client';

import Link from 'next/link';
import { ArrowRight, Bot, Clock3, Inbox, MessageCircle, ShieldCheck, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useBackofficeState } from '@/components/backoffice-context';
import { customers } from '@/lib/mock-data';
import { Avatar, CountBadge, Panel, StatusBadge } from '@/modules/shared/ui';

export function DashboardPageContent() {
  const {
    conversations,
    unreadCount,
    pendingCount,
    labels,
    labelCounts,
    setSelectedConversationId,
  } = useBackofficeState();

  const openCount = conversations.filter((conversation) => conversation.status === 'open').length;
  const resolvedCount = conversations.filter((conversation) => conversation.status === 'resolved').length;
  const aiAssignedCount = conversations.filter((conversation) => conversation.assignedTo === 'Harmony IA').length;
  const recentConversations = conversations.slice(0, 4);
  const frequentLabels = [...labels]
    .sort((left, right) => (labelCounts[right.id] ?? 0) - (labelCounts[left.id] ?? 0))
    .slice(0, 4);
  const maxLabelCount = Math.max(1, ...frequentLabels.map((label) => labelCounts[label.id] ?? 0));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen operativo">
          <MetricCard
            icon={<MessageCircle size={18} />}
            label="Conversaciones"
            value={String(conversations.length)}
            detail={`${openCount} abiertas ahora`}
          />
          <MetricCard
            icon={<Inbox size={18} />}
            label="Sin leer"
            value={String(unreadCount)}
            detail={unreadCount > 0 ? 'Requieren seguimiento' : 'Todo al día'}
            tone="warning"
          />
          <MetricCard
            icon={<Clock3 size={18} />}
            label="Pendientes"
            value={String(pendingCount)}
            detail="Esperando atención"
            tone="warning"
          />
          <MetricCard
            icon={<Users size={18} />}
            label="Clientes"
            value={String(customers.length)}
            detail="Registrados en Harmony"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,.75fr)]">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-neutral/10 px-4 py-3.5 md:px-5">
              <div>
                <h2 className="text-base font-semibold text-neutral">Conversaciones recientes</h2>
                <p className="mt-1 text-sm text-neutral/45">Lo último que está ocurriendo en la atención de Harmony.</p>
              </div>
              <Link href="/conversaciones" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition hover:opacity-75">
                Ver todas <ArrowRight size={14} />
              </Link>
            </div>

            <div className="divide-y divide-neutral/10">
              {recentConversations.map((conversation) => {
                const customer = customers.find((item) => item.id === conversation.customerId);
                const lastMessage = conversation.messages.at(-1);

                return (
                  <Link
                    key={conversation.id}
                    href="/conversaciones"
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-neutral/4 md:px-5"
                  >
                    <Avatar name={customer?.name ?? 'Cliente'} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <strong className="truncate text-base font-semibold text-neutral">{customer?.name ?? 'Cliente'}</strong>
                        <CountBadge count={conversation.unreadCount} tone="gold" />
                      </span>
                      <span className="mt-1 block truncate text-sm text-neutral/45">{lastMessage?.content ?? 'Sin mensajes recientes.'}</span>
                    </span>
                    <span className="hidden shrink-0 text-right sm:block">
                      <StatusBadge status={conversation.status} />
                      <span className="mt-1.5 block text-sm text-neutral/35">{conversation.lastMessageAt}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </Panel>

          <div className="space-y-5">
            <Panel className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-neutral">Estado de atención</h2>
                  <p className="mt-1 text-sm text-neutral/45">Carga actual del canal de atención.</p>
                </div>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <Bot size={17} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-md bg-primary/5 px-3 py-3">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-20" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-base font-semibold text-neutral">Harmony IA</strong>
                  <span className="mt-0.5 block text-sm text-neutral/45">{aiAssignedCount} conversaciones asignadas</span>
                </span>
                <span className="text-sm font-semibold text-primary">Conectado</span>
              </div>

              <div className="mt-4 space-y-3">
                <StatusProgress label="Abiertas" value={openCount} total={conversations.length} tone="primary" />
                <StatusProgress label="Pendientes" value={pendingCount} total={conversations.length} tone="warning" />
                <StatusProgress label="Resueltas" value={resolvedCount} total={conversations.length} tone="neutral" />
              </div>
            </Panel>

            <Panel className="p-4">
              <h2 className="text-base font-semibold text-neutral">Accesos rápidos</h2>
              <div className="mt-3 space-y-1">
                <QuickLink href="/conversaciones" icon={<Inbox size={16} />} label="Ir a conversaciones" />
                <QuickLink href="/clientes" icon={<Users size={16} />} label="Consultar clientes" />
                <QuickLink href="/usuarios" icon={<ShieldCheck size={16} />} label="Administrar usuarios" />
              </div>
            </Panel>
          </div>
        </section>

        <Panel className="p-4 md:p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-base font-semibold text-neutral">Temas frecuentes</h2>
              <p className="mt-1 text-sm text-neutral/45">Etiquetas más presentes en las conversaciones actuales.</p>
            </div>
            <span className="text-sm text-neutral/35">Actualizado con la bandeja actual</span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {frequentLabels.map((label) => {
              const count = labelCounts[label.id] ?? 0;
              const width = `${Math.max(8, (count / maxLabelCount) * 100)}%`;
              return (
                <div key={label.id} className="rounded-md border border-neutral/10 bg-neutral/3 px-3 py-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-neutral/70">{label.name}</span>
                    <span className="font-semibold text-neutral/45">{count}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral/8">
                    <div className="h-full rounded-full bg-primary/70" style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, detail, tone = 'primary' }: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: 'primary' | 'warning';
}) {
  const iconClass = tone === 'warning' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary';

  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${iconClass}`}>{icon}</span>
        <span className="text-sm font-medium text-neutral/35">Hoy</span>
      </div>
      <div className="mt-3">
        <span className="block text-sm font-medium text-neutral/45">{label}</span>
        <strong className="mt-1 block text-base font-semibold text-neutral">{value}</strong>
        <span className="mt-1 block text-sm text-neutral/40">{detail}</span>
      </div>
    </Panel>
  );
}

function StatusProgress({ label, value, total, tone }: {
  label: string;
  value: number;
  total: number;
  tone: 'primary' | 'warning' | 'neutral';
}) {
  const width = total > 0 ? `${Math.max(6, (value / total) * 100)}%` : '0%';
  const fillClass = tone === 'warning' ? 'bg-warning' : tone === 'neutral' ? 'bg-neutral/30' : 'bg-primary';

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-neutral/55">{label}</span>
        <span className="font-semibold text-neutral/70">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral/8">
        <div className={`h-full rounded-full ${fillClass}`} style={{ width }} />
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} className="flex h-10 items-center gap-2.5 rounded-md px-2.5 text-base font-medium text-neutral/65 transition hover:bg-neutral/5 hover:text-neutral">
      <span className="text-primary">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ArrowRight size={14} className="text-neutral/30" />
    </Link>
  );
}
