// Idempotent messaging/CRM seed for local or preview databases.
// Creates a WhatsApp channel, one customer, channel identity, tags, a conversation,
// inbound/outbound messages, one attachment and one processed webhook event.

import pg from 'pg';

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const IDS = {
  channel: '10000000-0000-4000-8000-000000000001',
  customer: '20000000-0000-4000-8000-000000000001',
  customerChannel: '30000000-0000-4000-8000-000000000001',
  customerTag: '40000000-0000-4000-8000-000000000001',
  conversationLabel: '50000000-0000-4000-8000-000000000001',
  conversation: '60000000-0000-4000-8000-000000000001',
  incomingMessage: '70000000-0000-4000-8000-000000000001',
  outgoingMessage: '70000000-0000-4000-8000-000000000002',
  attachment: '80000000-0000-4000-8000-000000000001',
  webhookEvent: '90000000-0000-4000-8000-000000000001',
};

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query('BEGIN');

  await client.query(
    `INSERT INTO public.channels (id, type, provider, name, external_id, phone, status, metadata)
     VALUES ($1, 'whatsapp', 'meta', 'WhatsApp Harmony Demo', 'harmony-demo-phone-number-id', '+573000000000', 'active', '{"environment":"seed"}'::jsonb)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now()`,
    [IDS.channel],
  );

  await client.query(
    `INSERT INTO public.customers (id, name, phone, email, notes, tags, custom_attributes, last_seen_at)
     VALUES ($1, 'Valentina Demo', '+573000000001', 'seed.customer@harmony.local', 'Cliente de prueba para mensajería', ARRAY['[seed] VIP', '[seed] Reserva'], '{"source":"seed","preferred_service":"spa romántico"}'::jsonb, now())
     ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name, phone = EXCLUDED.phone, email = EXCLUDED.email,
           custom_attributes = EXCLUDED.custom_attributes, updated_at = now()`,
    [IDS.customer],
  );

  await client.query(
    `INSERT INTO public.customer_channels (id, customer_id, channel_id, external_customer_id, address, metadata)
     VALUES ($1, $2, $3, '573000000001', '+573000000001', '{"verified":true}'::jsonb)
     ON CONFLICT (id) DO UPDATE SET address = EXCLUDED.address, updated_at = now()`,
    [IDS.customerChannel, IDS.customer, IDS.channel],
  );

  await client.query(
    `INSERT INTO public.customer_tags (id, name, color)
     VALUES ($1, '[seed] VIP', 'gold')
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color, updated_at = now()`,
    [IDS.customerTag],
  );

  await client.query(
    `INSERT INTO public.customer_tag_assignments (customer_id, tag_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [IDS.customer, IDS.customerTag],
  );

  await client.query(
    `INSERT INTO public.conversation_labels (id, name, color)
     VALUES ($1, '[seed] Reserva', 'green')
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color, updated_at = now()`,
    [IDS.conversationLabel],
  );

  await client.query(
    `INSERT INTO public.conversations
       (id, customer_id, customer_channel_id, channel, external_id, status, priority, unread_count, last_message_at, status_changed_at)
     VALUES ($1, $2, $3, 'whatsapp', 'wamid.conversation.seed', 'open', 'normal', 1, now(), now())
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, last_message_at = EXCLUDED.last_message_at, updated_at = now()`,
    [IDS.conversation, IDS.customer, IDS.customerChannel],
  );

  await client.query(
    `INSERT INTO public.conversation_label_assignments (conversation_id, label_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [IDS.conversation, IDS.conversationLabel],
  );

  const { rows: [agent] } = await client.query(
    `SELECT p.id, p.display_name
     FROM public.profiles p
     JOIN public.profile_roles pr ON pr.profile_id = p.id
     JOIN public.roles r ON r.id = pr.role_id
     WHERE r.code = 'agent' AND p.status = 'active'
     ORDER BY p.created_at ASC
     LIMIT 1`,
  );

  await client.query(
    `INSERT INTO public.messages
       (id, conversation_id, external_id, direction, sender_type, sender_name, content, content_type, status, metadata, created_at, updated_at)
     VALUES ($1, $2, 'wamid.seed.in.1', 'incoming', 'customer', 'Valentina Demo', 'Hola, quiero reservar un plan romántico.', 'text', 'read', '{"seed":true}'::jsonb, now() - interval '2 minutes', now() - interval '2 minutes')
     ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = now()`,
    [IDS.incomingMessage, IDS.conversation],
  );

  await client.query(
    `INSERT INTO public.messages
       (id, conversation_id, external_id, direction, sender_type, sender_profile_id, sender_name, content, content_type, status, metadata, created_at, updated_at)
     VALUES ($1, $2, 'wamid.seed.out.1', 'outgoing', 'agent', $3, $4, 'Claro. Te ayudo a revisar disponibilidad.', 'text', 'delivered', '{"seed":true}'::jsonb, now() - interval '1 minute', now() - interval '1 minute')
     ON CONFLICT (id) DO UPDATE SET sender_profile_id = EXCLUDED.sender_profile_id, sender_name = EXCLUDED.sender_name, content = EXCLUDED.content, updated_at = now()`,
    [IDS.outgoingMessage, IDS.conversation, agent?.id ?? null, agent?.display_name ?? 'Atención Harmony'],
  );

  await client.query(
    `INSERT INTO public.message_attachments (id, message_id, type, mime_type, file_name, url, metadata)
     VALUES ($1, $2, 'image', 'image/webp', 'plan-romantico.webp', 'https://example.invalid/plan-romantico.webp', '{"seed":true}'::jsonb)
     ON CONFLICT (id) DO UPDATE SET file_name = EXCLUDED.file_name`,
    [IDS.attachment, IDS.outgoingMessage],
  );

  await client.query(
    `INSERT INTO public.webhook_events
       (id, channel_id, provider, external_event_id, event_type, status, payload, processed_at)
     VALUES ($1, $2, 'meta', 'seed-event-001', 'messages', 'processed', '{"seed":true}'::jsonb, now())
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, processed_at = now()`,
    [IDS.webhookEvent, IDS.channel],
  );

  await client.query('COMMIT');
  console.log('Messaging seed complete: 1 channel, 1 customer, 1 conversation, 2 messages, 1 attachment and 1 webhook event.');
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.end();
}
