-- Harmony messaging/CRM data model.
-- Backward-compatible migration: customers.tags remains available while normalized tags are adopted by the app.

CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  provider text NOT NULL DEFAULT 'meta',
  name text NOT NULL,
  external_id text,
  phone text,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX channels_type_external_id_unique_idx ON public.channels (type, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX channels_status_idx ON public.channels (status);

CREATE TABLE public.customer_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  external_customer_id text NOT NULL,
  address text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX customer_channels_channel_external_unique_idx ON public.customer_channels (channel_id, external_customer_id);
CREATE INDEX customer_channels_customer_id_idx ON public.customer_channels (customer_id);

CREATE TABLE public.customer_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT 'zinc',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX customer_tags_name_unique_idx ON public.customer_tags (lower(name));

CREATE TABLE public.customer_tag_assignments (
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.customer_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, tag_id)
);
CREATE INDEX customer_tag_assignments_tag_id_idx ON public.customer_tag_assignments (tag_id, customer_id);

ALTER TABLE public.customers ADD COLUMN custom_attributes jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Preserve legacy customer tags while backfilling the normalized tag model.
INSERT INTO public.customer_tags (name)
SELECT DISTINCT btrim(tag)
FROM public.customers c
CROSS JOIN LATERAL unnest(c.tags) AS tag
WHERE btrim(tag) <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.customer_tag_assignments (customer_id, tag_id)
SELECT c.id, ct.id
FROM public.customers c
CROSS JOIN LATERAL unnest(c.tags) AS tag
JOIN public.customer_tags ct ON lower(ct.name) = lower(btrim(tag))
WHERE btrim(tag) <> ''
ON CONFLICT DO NOTHING;

ALTER TABLE public.conversations
  ADD COLUMN customer_channel_id uuid,
  ADD COLUMN priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN first_reply_at timestamptz,
  ADD COLUMN status_changed_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.conversations ADD CONSTRAINT conversations_customer_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_customer_channel_id_fk FOREIGN KEY (customer_channel_id) REFERENCES public.customer_channels(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_assigned_to_fk FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX conversations_customer_id_idx ON public.conversations (customer_id);
CREATE INDEX conversations_customer_channel_id_idx ON public.conversations (customer_channel_id);
CREATE INDEX conversations_status_last_message_idx ON public.conversations (status, last_message_at DESC);
CREATE INDEX conversations_assigned_status_last_message_idx ON public.conversations (assigned_to, status, last_message_at DESC);
CREATE UNIQUE INDEX conversations_customer_channel_external_unique_idx ON public.conversations (customer_channel_id, external_id) WHERE customer_channel_id IS NOT NULL AND external_id IS NOT NULL;

ALTER TABLE public.messages
  ADD COLUMN content_type text NOT NULL DEFAULT 'text',
  ADD COLUMN reply_to_message_id uuid,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.messages ADD CONSTRAINT messages_conversation_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_profile_id_fk FOREIGN KEY (sender_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD CONSTRAINT messages_reply_to_message_id_fk FOREIGN KEY (reply_to_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;
CREATE INDEX messages_conversation_created_at_idx ON public.messages (conversation_id, created_at);
CREATE UNIQUE INDEX messages_conversation_external_id_unique_idx ON public.messages (conversation_id, external_id) WHERE external_id IS NOT NULL;

CREATE TABLE public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  type text NOT NULL,
  mime_type text,
  file_name text,
  url text,
  storage_key text,
  size_bytes integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX message_attachments_message_id_idx ON public.message_attachments (message_id);

CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.channels(id) ON DELETE SET NULL,
  provider text NOT NULL,
  external_event_id text NOT NULL,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'received',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX webhook_events_provider_external_event_unique_idx ON public.webhook_events (provider, external_event_id);
CREATE INDEX webhook_events_status_created_at_idx ON public.webhook_events (status, created_at);

-- Close referential-integrity gaps that existed before the messaging schema.
ALTER TABLE public.profile_roles ADD CONSTRAINT profile_roles_profile_id_fk FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.profile_roles ADD CONSTRAINT profile_roles_role_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;
ALTER TABLE public.profile_roles ADD CONSTRAINT profile_roles_assigned_by_fk FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_permission_id_fk FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_actor_profile_id_fk FOREIGN KEY (actor_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX customers_phone_idx ON public.customers (phone);
CREATE INDEX customers_email_lower_idx ON public.customers (lower(email)) WHERE email IS NOT NULL;
