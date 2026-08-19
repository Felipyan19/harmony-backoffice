export type DashboardIntegrationKind = 'whatsapp' | 'calendar' | 'wompi' | 'crm';

export interface DashboardReservationMock {
  id: string;
  customer: string;
  service: string;
  time: string;
  price: string;
  isNew?: boolean;
}

export interface DashboardCalendarEventMock {
  id: string;
  time: string;
  customer: string;
  service: string;
  tone: 'primary' | 'warning';
}

export interface DashboardActivityMock {
  id: string;
  kind: 'reservation' | 'customer' | 'reminder' | 'confirmation';
  title: string;
  detail: string;
}

export interface DashboardIntegrationMock {
  id: string;
  kind: DashboardIntegrationKind;
  name: string;
}

/**
 * Presentation-only seed for the Home dashboard.
 * Keep this isolated from messaging mock data so the dashboard can later
 * swap to real reservations/payments/calendar queries without coupling domains.
 */
export const dashboardMockData = {
  metrics: {
    reservationsToday: '5',
    customers: '28',
    revenueToday: '$780K',
  },
  reservations: [
    {
      id: 'res_felipe',
      customer: 'Felipe Castaño',
      service: 'Masaje relajante',
      time: '5:00 PM',
      price: '$120.000 COP',
      isNew: true,
    },
    {
      id: 'res_maria',
      customer: 'María González',
      service: 'Masaje deportivo',
      time: '2:00 PM',
      price: '$110.000 COP',
    },
    {
      id: 'res_laura',
      customer: 'Laura Restrepo',
      service: 'Limpieza facial profunda',
      time: '3:30 PM',
      price: '$90.000 COP',
    },
  ] satisfies DashboardReservationMock[],
  calendarEvents: [
    {
      id: 'cal_felipe',
      time: '5:00 PM',
      customer: 'Felipe Castaño',
      service: 'Masaje relajante',
      tone: 'primary',
    },
    {
      id: 'cal_pending',
      time: '6:30 PM',
      customer: 'Reserva pendiente',
      service: 'Masaje en pareja',
      tone: 'warning',
    },
  ] satisfies DashboardCalendarEventMock[],
  activity: [
    {
      id: 'act_reservation',
      kind: 'reservation',
      title: 'Reserva creada',
      detail: 'Masaje relajante · 5:00 PM',
    },
    {
      id: 'act_customer',
      kind: 'customer',
      title: 'Cliente registrado',
      detail: 'Felipe Castaño',
    },
    {
      id: 'act_reminder',
      kind: 'reminder',
      title: 'Recordatorio programado',
      detail: '24 h antes por WhatsApp',
    },
    {
      id: 'act_confirmation',
      kind: 'confirmation',
      title: 'Confirmación preparada',
      detail: 'WhatsApp Business',
    },
  ] satisfies DashboardActivityMock[],
  integrations: [
    { id: 'int_whatsapp', kind: 'whatsapp', name: 'WhatsApp Business' },
    { id: 'int_calendar', kind: 'calendar', name: 'Google Calendar' },
    { id: 'int_wompi', kind: 'wompi', name: 'Wompi' },
    { id: 'int_crm', kind: 'crm', name: 'Ignite CRM' },
  ] satisfies DashboardIntegrationMock[],
};
