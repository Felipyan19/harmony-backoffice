// Idempotent messaging/CRM seed for local or preview databases.
// Requires the multi-tenant workspace migration and targets the Harmony workspace.

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

  const { rows: [workspace] } = await client.query(
    `SELECT id FROM public.workspaces WHERE lower(slug) = 'harmony' AND status = 'active' LIMIT 1`,
  );
  if (!workspace) throw new Error('Harmony workspace not found. Run the multi-tenant migration / db:seed first.');

  const workspaceId = workspace.id;

  await client.query(
    `INSERT INTO public.channels
       (id, workspace_id, type, provider, name, external_id, phone, status, metadata)
     VALUES ($1, $2, 'whatsapp', 'meta', 'WhatsApp Harmony Demo', 'harmony-demo-phone-number-id', '+573000000000', 'active', '{"environment":"seed"}'::jsonb)
     ON CONFLICT (id) DO UPDATE
       SET workspace_id = EXCLUDED.workspace_id, name = EXCLUDED.name, updated_at = now()`,
    [IDS.channel, workspaceId],
  );

  await client.query(
    `INSERT INTO public.customers
       (id, workspace_id, name, phone, email, notes, tags, custom_attributes, last_seen_at)
     VALUES ($1, $2, 'Valentina Demo', '+573000000001', 'seed.customer@harmony.local', 'Cliente de prueba para mensajería', ARRAY['[seed] VIP', '[seed] Reserva'], '{"source":"seed","preferred_service":"spa romántico"}'::jsonb, now())
     ON CONFLICT (id) DO UPDATE
       SET workspace_id = EXCLUDED.workspace_id,
           name = EXCLUDED.name,
           phone = EXCLUDED.phone,
           email = EXCLUDED.email,
           custom_attributes = EXCLUDED.custom_attributes,
           updated_at = now()`,
    [IDS.customer, workspaceId],
  );

  await client.query(
    `INSERT INTO public.customer_channels
       (id, workspace_id, customer_id, channel_id, external_customer_id, address, metadata)
     VALUES ($1, $2, $3, $4, '573000000001', '+573000000001', '{"verified":true}'::jsonb)
     ON CONFLICT (id) DO UPDATE
       SET workspace_id = EXCLUDED.workspace_id, address = EXCLUDED.address, updated_at = now()`,
    [IDS.customerChannel, workspaceId, IDS.customer, IDS.channel],
  );

  const customerTags = [
    ['[seed] VIP', 'gold'],
    ['[seed] Reserva', 'green'],
  ];

  for (const [name, color] of customerTags) {
    await client.query(
      `INSERT INTO public.customer_tags (workspace_id, name, color)
       SELECT $1, $2, $3
       WHERE NOT EXISTS (
         SELECT 1 FROM public.customer_tags
         WHERE workspace_id = $1 AND lower(name) = lower($2)
       )`,
      [workspaceId, name, color],
    );

    const { rows: [tag] } = await client.query(
      `UPDATE public.customer_tags
       SET color = $3, updated_at = now()
       WHERE workspace_id = $1 AND lower(name) = lower($2)
       RETURNING id`,
      [workspaceId, name, color],
    );

    await client.query(
      `INSERT INTO public.customer_tag_assignments (workspace_id, customer_id, tag_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (customer_id, tag_id) DO UPDATE SET workspace_id = EXCLUDED.workspace_id`,
      [workspaceId, IDS.customer, tag.id],
    );
  }

  await client.query(
    `INSERT INTO public.conversation_labels (id, workspace_id, name, color)
     VALUES ($1, $2, '[seed] Reserva', 'green')
     ON CONFLICT (id) DO UPDATE
       SET workspace_id = EXCLUDED.workspace_id, name = EXCLUDED.name, color = EXCLUDED.color, updated_at = now()`,
    [IDS.conversationLabel, workspaceId],
  );

  const { rows: [agent] } = await client.query(
    `SELECT p.id AS profile_id, wm.id AS membership_id, p.display_name
     FROM public.workspace_memberships wm
     JOIN public.profiles p ON p.id = wm.profile_id
     JOIN public.workspace_membership_roles wmr ON wmr.membership_id = wm.id
     JOIN public.roles r ON r.id = wmr.role_id
     WHERE wm.workspace_id = $1
       AND wm.status = 'active'
       AND p.status = 'active'
       AND r.code = 'agent'
     ORDER BY wm.created_at ASC
     LIMIT 1`,
    [workspaceId],
  );

  await client.query(
    `INSERT INTO public.conversations
       (id, workspace_id, customer_id, customer_channel_id, channel, external_id, status, priority,
        assigned_to, assigned_membership_id, unread_count, last_message_at, status_changed_at)
     VALUES ($1, $2, $3, $4, 'whatsapp', 'wamid.conversation.seed', 'open', 'normal',
             $5, $6, 1, now(), now())
     ON CONFLICT (id) DO UPDATE
       SET workspace_id = EXCLUDED.workspace_id,
           status = EXCLUDED.status,
           assigned_to = EXCLUDED.assigned_to,
           assigned_membership_id = EXCLUDED.assigned_membership_id,
           last_message_at = EXCLUDED.last_message_at,
           updated_at = now()`,
    [
      IDS.conversation,
      workspaceId,
      IDS.customer,
      IDS.customerChannel,
      agent?.profile_id ?? null,
      agent?.membership_id ?? null,
    ],
  );

  await client.query(
    `INSERT INTO public.conversation_label_assignments (workspace_id, conversation_id, label_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (conversation_id, label_id) DO UPDATE SET workspace_id = EXCLUDED.workspace_id`,
    [workspaceId, IDS.conversation, IDS.conversationLabel],
  );

  await client.query(
    `INSERT INTO public.messages
       (id, workspace_id, conversation_id, external_id, direction, sender_type, sender_name,
        content, content_type, status, metadata, created_at, updated_at)
     VALUES ($1, $2, $3, 'wamid.seed.in.1', 'incoming', 'customer', 'Valentina Demo',
             'Hola, quiero reservar un plan romántico.', 'text', 'read', '{"seed":true}'::jsonb,
             now() - interval '2 minutes', now() - interval '2 minutes')
     ON CONFLICT (id) DO UPDATE
       SET workspace_id = EXCLUDED.workspace_id, content = EXCLUDED.content, updated_at = now()`,
    [IDS.incomingMessage, workspaceId, IDS.conversation],
  );

  await client.query(
    `INSERT INTO public.messages
       (id, workspace_id, conversation_id, external_id, direction, sender_type,
        sender_profile_id, sender_membership_id, sender_name, content, content_type, status,
        metadata, created_at, updated_at)
     VALUES ($1, $2, $3, 'wamid.seed.out.1', 'outgoing', 'agent',
             $4, $5, $6, 'Claro. Te ayudo a revisar disponibilidad.', 'text', 'delivered',
             '{"seed":true}'::jsonb, now() - interval '1 minute', now() - interval '1 minute')
     ON CONFLICT (id) DO UPDATE
       SET workspace_id = EXCLUDED.workspace_id,
           sender_profile_id = EXCLUDED.sender_profile_id,
           sender_membership_id = EXCLUDED.sender_membership_id,
           sender_name = EXCLUDED.sender_name,
           content = EXCLUDED.content,
           updated_at = now()`,
    [
      IDS.outgoingMessage,
      workspaceId,
      IDS.conversation,
      agent?.profile_id ?? null,
      agent?.membership_id ?? null,
      agent?.display_name ?? 'Atención Harmony',
    ],
  );

  await client.query(
    `INSERT INTO public.message_attachments
       (id, workspace_id, message_id, type, mime_type, file_name, url, metadata)
     VALUES ($1, $2, $3, 'image', 'image/webp', 'plan-romantico.webp',
             'https://example.invalid/plan-romantico.webp', '{"seed":true}'::jsonb)
     ON CONFLICT (id) DO UPDATE
       SET workspace_id = EXCLUDED.workspace_id, file_name = EXCLUDED.file_name`,
    [IDS.attachment, workspaceId, IDS.outgoingMessage],
  );

  await client.query(
    `INSERT INTO public.webhook_events
       (id, workspace_id, channel_id, provider, external_event_id, event_type, status, payload, processed_at)
     VALUES ($1, $2, $3, 'meta', 'seed-event-001', 'messages', 'processed', '{"seed":true}'::jsonb, now())
     ON CONFLICT (id) DO UPDATE
       SET workspace_id = EXCLUDED.workspace_id, status = EXCLUDED.status, processed_at = now()`,
    [IDS.webhookEvent, workspaceId, IDS.channel],
  );

  await client.query('COMMIT');
  console.log('Messaging seed complete for Harmony: 1 channel, 1 customer, 2 tags, 1 conversation, 2 messages, 1 attachment and 1 webhook event.');
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.end();
}
