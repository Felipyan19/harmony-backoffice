import {
  Bell,
  CalendarDays,
  CreditCard,
  MessageCircle,
  UserPlus,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
  dashboardMockData,
  type DashboardActivityMock,
  type DashboardIntegrationKind,
  type DashboardReservationMock,
} from '@/lib/dashboard-mock-data';
import { Badge, Panel } from '@/modules/shared/ui';

export function DashboardPageContent() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de operación">
          <MetricCard
            icon={<CalendarDays size={18} />}
            label="Reservas hoy"
            value={dashboardMockData.metrics.reservationsToday}
          />
          <MetricCard
            icon={<Users size={18} />}
            label="Clientes"
            value={dashboardMockData.metrics.customers}
          />
          <MetricCard
            icon={<CreditCard size={18} />}
            label="Cobros"
            value={dashboardMockData.metrics.revenueToday}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,.78fr)]">
          <div className="min-w-0 space-y-4">
            <Panel className="overflow-hidden">
              <div className="flex items-end justify-between gap-4 border-b border-neutral/10 px-4 py-3.5 md:px-5">
                <div>
                  <h2 className="text-base font-semibold text-neutral">Reservas de hoy</h2>
                  <p className="mt-1 text-sm text-neutral/45">Agenda operativa</p>
                </div>
                <span className="shrink-0 text-sm font-medium text-neutral/45">5 reservas</span>
              </div>

              <div className="divide-y divide-neutral/10 px-4 py-2 md:px-5">
                {dashboardMockData.reservations.map((reservation) => (
                  <ReservationRow key={reservation.id} reservation={reservation} />
                ))}
              </div>
            </Panel>

            <Panel className="overflow-hidden">
              <div className="flex items-center justify-between gap-4 border-b border-neutral/10 px-4 py-3.5 md:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                    <CalendarDays size={17} />
                  </span>
                  <span className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-neutral">Calendario conectado</h2>
                    <span className="mt-0.5 block text-sm text-neutral/45">Google Calendar</span>
                  </span>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary">Sincronizado</span>
              </div>

              <div className="px-4 py-4 md:px-5">
                <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-3">
                  <CalendarTimeLabel label="4 PM" />
                  <div className="border-t border-neutral/10" />

                  {dashboardMockData.calendarEvents.map((event) => (
                    <CalendarEvent
                      key={event.id}
                      time={event.time}
                      customer={event.customer}
                      service={event.service}
                      tone={event.tone}
                    />
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          <aside className="space-y-4">
            <Panel className="overflow-hidden">
              <div className="flex items-end justify-between gap-3 border-b border-neutral/10 px-4 py-3.5">
                <div>
                  <h2 className="text-base font-semibold text-neutral">Actividad reciente</h2>
                  <p className="mt-1 text-sm text-neutral/45">Últimos cambios del flujo</p>
                </div>
                <span className="text-sm font-semibold text-primary">Ahora</span>
              </div>

              <div className="divide-y divide-neutral/10 px-4">
                {dashboardMockData.activity.map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))}
              </div>
            </Panel>

            <Panel className="overflow-hidden">
              <div className="flex items-end justify-between gap-3 border-b border-neutral/10 px-4 py-3.5">
                <div>
                  <h2 className="text-base font-semibold text-neutral">Integraciones</h2>
                  <p className="mt-1 text-sm text-neutral/45">Herramientas conectadas</p>
                </div>
                <span className="text-sm font-medium text-neutral/45">4</span>
              </div>

              <div className="divide-y divide-neutral/10 px-4">
                {dashboardMockData.integrations.map((integration) => (
                  <div key={integration.id} className="flex items-center gap-3 py-3">
                    <IntegrationMark kind={integration.kind} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral/80">{integration.name}</span>
                    <span className="shrink-0 text-sm font-semibold text-primary">Conectado</span>
                  </div>
                ))}
              </div>
            </Panel>
          </aside>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Panel className="p-4">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">{icon}</span>
      <div className="mt-3">
        <span className="block text-sm font-medium text-neutral/45">{label}</span>
        <strong className="mt-1 block text-lg font-semibold tracking-[-0.02em] text-neutral">{value}</strong>
      </div>
    </Panel>
  );
}

function ReservationRow({ reservation }: { reservation: DashboardReservationMock }) {
  return (
    <div className={`grid gap-3 py-3.5 sm:grid-cols-[minmax(0,1.35fr)_minmax(100px,.72fr)_auto] sm:items-center ${reservation.isNew ? '-mx-2 rounded-md bg-primary/6 px-2' : ''}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {reservation.isNew ? <Badge tone="primary" compact>Nueva</Badge> : null}
          <strong className="truncate text-base font-semibold text-neutral">{reservation.customer}</strong>
        </div>
        <p className="mt-1 truncate text-sm text-neutral/45">{reservation.service}</p>
      </div>

      <div className="min-w-0">
        <strong className="block text-sm font-semibold text-neutral">{reservation.time}</strong>
        <span className="mt-1 block text-sm text-neutral/45">{reservation.price}</span>
      </div>

      <div className="flex items-center gap-2 sm:justify-end">
        <Badge tone="primary" compact>Confirmada</Badge>
        <span className="grid h-8 w-8 place-items-center rounded-md border border-primary/15 bg-primary/8 text-primary" title="WhatsApp Business">
          <MessageCircle size={16} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function CalendarTimeLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 py-3 text-sm text-neutral/40">
      <span className="h-2 w-2 rounded-full border border-neutral/30" aria-hidden="true" />
      {label}
    </div>
  );
}

function CalendarEvent({ time, customer, service, tone }: {
  time: string;
  customer: string;
  service: string;
  tone: 'primary' | 'warning';
}) {
  const eventClass = tone === 'warning'
    ? 'border-warning bg-warning/8 text-warning'
    : 'border-primary bg-primary/8 text-primary';

  return (
    <>
      <CalendarTimeLabel label={time.replace(':00', '')} />
      <div className={`my-2 rounded-md border-l-2 px-3 py-2.5 ${eventClass}`}>
        <strong className="block text-sm font-semibold">{time} · {customer}</strong>
        <span className="mt-0.5 block text-sm opacity-75">{service}</span>
      </div>
    </>
  );
}

function ActivityRow({ activity }: { activity: DashboardActivityMock }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-neutral/5 text-primary">
        <ActivityIcon kind={activity.kind} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm font-semibold text-neutral">{activity.title}</strong>
        <span className="mt-0.5 block truncate text-sm text-neutral/45">{activity.detail}</span>
      </span>
      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
    </div>
  );
}

function ActivityIcon({ kind }: { kind: DashboardActivityMock['kind'] }) {
  if (kind === 'reservation') return <CalendarDays size={16} />;
  if (kind === 'customer') return <UserPlus size={16} />;
  if (kind === 'reminder') return <Bell size={16} />;
  return <MessageCircle size={16} />;
}

function IntegrationMark({ kind }: { kind: DashboardIntegrationKind }) {
  const icon = kind === 'calendar'
    ? <CalendarDays size={16} />
    : kind === 'wompi'
      ? <CreditCard size={16} />
      : kind === 'crm'
        ? <Users size={16} />
        : <MessageCircle size={16} />;

  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-primary/15 bg-primary/8 text-primary">
      {icon}
    </span>
  );
}
