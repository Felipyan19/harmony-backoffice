BEGIN;

CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX workspaces_slug_unique_idx
  ON public.workspaces (lower(slug));
CREATE INDEX workspaces_status_idx
  ON public.workspaces (status);

CREATE TABLE public.workspace_branding (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  logo_url text,
  primary_color text NOT NULL DEFAULT '#33513a',
  secondary_color text NOT NULL DEFAULT '#22362a',
  accent_color text NOT NULL DEFAULT '#b4894a',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.workspace_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workspace_memberships_workspace_profile_unique UNIQUE (workspace_id, profile_id),
  CONSTRAINT workspace_memberships_workspace_id_id_unique UNIQUE (workspace_id, id)
);

CREATE INDEX workspace_memberships_profile_status_idx
  ON public.workspace_memberships (profile_id, status);
CREATE INDEX workspace_memberships_workspace_status_idx
  ON public.workspace_memberships (workspace_id, status);

CREATE TABLE public.workspace_membership_roles (
  membership_id uuid NOT NULL REFERENCES public.workspace_memberships(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workspace_membership_roles_pk PRIMARY KEY (membership_id, role_id)
);

CREATE INDEX workspace_membership_roles_role_idx
  ON public.workspace_membership_roles (role_id, membership_id);

CREATE TABLE public.platform_staff (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.workspaces (name, slug, status, created_by_profile_id)
SELECT
  'Harmony',
  'harmony',
  'active',
  (
    SELECT p.id
    FROM public.profiles p
    JOIN public.users u ON u.id = p.user_id
    WHERE lower(u.email) = 'admin@harmony.test'
    LIMIT 1
  )
WHERE NOT EXISTS (
  SELECT 1 FROM public.workspaces WHERE lower(slug) = 'harmony'
);

INSERT INTO public.workspace_branding (
  workspace_id, logo_url, primary_color, secondary_color, accent_color
)
SELECT w.id, NULL, '#33513a', '#22362a', '#b4894a'
FROM public.workspaces w
WHERE lower(w.slug) = 'harmony'
ON CONFLICT (workspace_id) DO NOTHING;

INSERT INTO public.workspace_memberships (workspace_id, profile_id, status)
SELECT w.id, p.id, 'active'
FROM public.workspaces w
CROSS JOIN public.profiles p
WHERE lower(w.slug) = 'harmony'
ON CONFLICT (workspace_id, profile_id) DO NOTHING;

INSERT INTO public.workspace_membership_roles (membership_id, role_id, assigned_by)
SELECT wm.id, pr.role_id, pr.assigned_by
FROM public.workspace_memberships wm
JOIN public.workspaces w ON w.id = wm.workspace_id
JOIN public.profile_roles pr ON pr.profile_id = wm.profile_id
WHERE lower(w.slug) = 'harmony'
ON CONFLICT (membership_id, role_id) DO NOTHING;

ALTER TABLE public.audit_logs ADD COLUMN workspace_id uuid;
ALTER TABLE public.customers ADD COLUMN workspace_id uuid;
ALTER TABLE public.channels ADD COLUMN workspace_id uuid;
ALTER TABLE public.customer_channels ADD COLUMN workspace_id uuid;
ALTER TABLE public.customer_tags ADD COLUMN workspace_id uuid;
ALTER TABLE public.customer_tag_assignments ADD COLUMN workspace_id uuid;
ALTER TABLE public.conversation_labels ADD COLUMN workspace_id uuid;
ALTER TABLE public.conversations ADD COLUMN workspace_id uuid;
ALTER TABLE public.conversations ADD COLUMN assigned_membership_id uuid;
ALTER TABLE public.conversation_label_assignments ADD COLUMN workspace_id uuid;
ALTER TABLE public.messages ADD COLUMN workspace_id uuid;
ALTER TABLE public.messages ADD COLUMN sender_membership_id uuid;
ALTER TABLE public.message_attachments ADD COLUMN workspace_id uuid;
ALTER TABLE public.webhook_events ADD COLUMN workspace_id uuid;

UPDATE public.audit_logs
SET workspace_id = w.id
FROM public.workspaces w
WHERE audit_logs.workspace_id IS NULL
  AND lower(w.slug) = 'harmony';

UPDATE public.customers
SET workspace_id = w.id
FROM public.workspaces w
WHERE customers.workspace_id IS NULL
  AND lower(w.slug) = 'harmony';

UPDATE public.channels
SET workspace_id = w.id
FROM public.workspaces w
WHERE channels.workspace_id IS NULL
  AND lower(w.slug) = 'harmony';

UPDATE public.customer_channels cc
SET workspace_id = c.workspace_id
FROM public.customers c
WHERE cc.customer_id = c.id
  AND cc.workspace_id IS NULL;

UPDATE public.customer_tags
SET workspace_id = w.id
FROM public.workspaces w
WHERE customer_tags.workspace_id IS NULL
  AND lower(w.slug) = 'harmony';

UPDATE public.customer_tag_assignments cta
SET workspace_id = c.workspace_id
FROM public.customers c
WHERE cta.customer_id = c.id
  AND cta.workspace_id IS NULL;

UPDATE public.conversation_labels
SET workspace_id = w.id
FROM public.workspaces w
WHERE conversation_labels.workspace_id IS NULL
  AND lower(w.slug) = 'harmony';

UPDATE public.conversations c
SET workspace_id = customer.workspace_id
FROM public.customers customer
WHERE c.customer_id = customer.id
  AND c.workspace_id IS NULL;

UPDATE public.conversation_label_assignments cla
SET workspace_id = c.workspace_id
FROM public.conversations c
WHERE cla.conversation_id = c.id
  AND cla.workspace_id IS NULL;

UPDATE public.messages m
SET workspace_id = c.workspace_id
FROM public.conversations c
WHERE m.conversation_id = c.id
  AND m.workspace_id IS NULL;

UPDATE public.message_attachments ma
SET workspace_id = m.workspace_id
FROM public.messages m
WHERE ma.message_id = m.id
  AND ma.workspace_id IS NULL;

UPDATE public.webhook_events we
SET workspace_id = ch.workspace_id
FROM public.channels ch
WHERE we.channel_id = ch.id
  AND we.workspace_id IS NULL;

UPDATE public.webhook_events
SET workspace_id = w.id
FROM public.workspaces w
WHERE webhook_events.workspace_id IS NULL
  AND lower(w.slug) = 'harmony';

UPDATE public.conversations c
SET assigned_membership_id = wm.id
FROM public.workspace_memberships wm
WHERE c.assigned_to = wm.profile_id
  AND c.workspace_id = wm.workspace_id
  AND c.assigned_membership_id IS NULL;

UPDATE public.messages m
SET sender_membership_id = wm.id
FROM public.workspace_memberships wm
WHERE m.sender_profile_id = wm.profile_id
  AND m.workspace_id = wm.workspace_id
  AND m.sender_membership_id IS NULL;

INSERT INTO public.customer_tags (workspace_id, name, color)
SELECT DISTINCT c.workspace_id, btrim(tag_name), 'zinc'
FROM public.customers c
CROSS JOIN LATERAL unnest(c.tags) AS legacy(tag_name)
WHERE btrim(tag_name) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.customer_tags ct
    WHERE ct.workspace_id = c.workspace_id
      AND lower(ct.name) = lower(btrim(tag_name))
  );

INSERT INTO public.customer_tag_assignments (workspace_id, customer_id, tag_id)
SELECT c.workspace_id, c.id, ct.id
FROM public.customers c
CROSS JOIN LATERAL unnest(c.tags) AS legacy(tag_name)
JOIN public.customer_tags ct
  ON ct.workspace_id = c.workspace_id
 AND lower(ct.name) = lower(btrim(tag_name))
WHERE btrim(tag_name) <> ''
ON CONFLICT (customer_id, tag_id) DO NOTHING;

ALTER TABLE public.customers ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.channels ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.customer_channels ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.customer_tags ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.customer_tag_assignments ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.conversation_labels ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.conversations ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.conversation_label_assignments ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.message_attachments ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.webhook_events ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_workspace_id_fk
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE SET NULL;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_workspace_id_fk
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);

ALTER TABLE public.channels
  ADD CONSTRAINT channels_workspace_id_fk
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);

ALTER TABLE public.customer_channels
  ADD CONSTRAINT customer_channels_workspace_id_fk
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);

ALTER TABLE public.customer_tags
  ADD CONSTRAINT customer_tags_workspace_id_fk
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);

ALTER TABLE public.customer_tag_assignments
  ADD CONSTRAINT customer_tag_assignments_workspace_id_fk
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);

ALTER TABLE public.conversation_labels
  ADD CONSTRAINT conversation_labels_workspace_id_fk
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_workspace_id_fk
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);

ALTER TABLE public.conversation_label_assignments
  ADD CONSTRAINT conversation_label_assignments_workspace_id_fk
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);

ALTER TABLE public.messages
  ADD CONSTRAINT messages_workspace_id_fk
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);

ALTER TABLE public.message_attachments
  ADD CONSTRAINT message_attachments_workspace_id_fk
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);

ALTER TABLE public.webhook_events
  ADD CONSTRAINT webhook_events_workspace_id_fk
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);

ALTER TABLE public.customers
  ADD CONSTRAINT customers_workspace_id_id_unique UNIQUE (workspace_id, id);
ALTER TABLE public.channels
  ADD CONSTRAINT channels_workspace_id_id_unique UNIQUE (workspace_id, id);
ALTER TABLE public.customer_channels
  ADD CONSTRAINT customer_channels_workspace_id_id_unique UNIQUE (workspace_id, id);
ALTER TABLE public.customer_tags
  ADD CONSTRAINT customer_tags_workspace_id_id_unique UNIQUE (workspace_id, id);
ALTER TABLE public.conversation_labels
  ADD CONSTRAINT conversation_labels_workspace_id_id_unique UNIQUE (workspace_id, id);
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_workspace_id_id_unique UNIQUE (workspace_id, id);
ALTER TABLE public.messages
  ADD CONSTRAINT messages_workspace_id_id_unique UNIQUE (workspace_id, id);

ALTER TABLE public.customer_channels
  ADD CONSTRAINT customer_channels_workspace_customer_fk
  FOREIGN KEY (workspace_id, customer_id)
  REFERENCES public.customers(workspace_id, id),
  ADD CONSTRAINT customer_channels_workspace_channel_fk
  FOREIGN KEY (workspace_id, channel_id)
  REFERENCES public.channels(workspace_id, id);

ALTER TABLE public.customer_tag_assignments
  ADD CONSTRAINT customer_tag_assignments_workspace_customer_fk
  FOREIGN KEY (workspace_id, customer_id)
  REFERENCES public.customers(workspace_id, id),
  ADD CONSTRAINT customer_tag_assignments_workspace_tag_fk
  FOREIGN KEY (workspace_id, tag_id)
  REFERENCES public.customer_tags(workspace_id, id);

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_workspace_customer_fk
  FOREIGN KEY (workspace_id, customer_id)
  REFERENCES public.customers(workspace_id, id),
  ADD CONSTRAINT conversations_workspace_customer_channel_fk
  FOREIGN KEY (workspace_id, customer_channel_id)
  REFERENCES public.customer_channels(workspace_id, id),
  ADD CONSTRAINT conversations_assigned_membership_id_fk
  FOREIGN KEY (assigned_membership_id)
  REFERENCES public.workspace_memberships(id)
  ON DELETE SET NULL,
  ADD CONSTRAINT conversations_workspace_assigned_membership_fk
  FOREIGN KEY (workspace_id, assigned_membership_id)
  REFERENCES public.workspace_memberships(workspace_id, id);

ALTER TABLE public.conversation_label_assignments
  ADD CONSTRAINT conversation_label_assignments_workspace_conversation_fk
  FOREIGN KEY (workspace_id, conversation_id)
  REFERENCES public.conversations(workspace_id, id),
  ADD CONSTRAINT conversation_label_assignments_workspace_label_fk
  FOREIGN KEY (workspace_id, label_id)
  REFERENCES public.conversation_labels(workspace_id, id);

ALTER TABLE public.messages
  ADD CONSTRAINT messages_workspace_conversation_fk
  FOREIGN KEY (workspace_id, conversation_id)
  REFERENCES public.conversations(workspace_id, id),
  ADD CONSTRAINT messages_sender_membership_id_fk
  FOREIGN KEY (sender_membership_id)
  REFERENCES public.workspace_memberships(id)
  ON DELETE SET NULL,
  ADD CONSTRAINT messages_workspace_sender_membership_fk
  FOREIGN KEY (workspace_id, sender_membership_id)
  REFERENCES public.workspace_memberships(workspace_id, id),
  ADD CONSTRAINT messages_workspace_reply_to_fk
  FOREIGN KEY (workspace_id, reply_to_message_id)
  REFERENCES public.messages(workspace_id, id);

ALTER TABLE public.message_attachments
  ADD CONSTRAINT message_attachments_workspace_message_fk
  FOREIGN KEY (workspace_id, message_id)
  REFERENCES public.messages(workspace_id, id);

ALTER TABLE public.webhook_events
  ADD CONSTRAINT webhook_events_workspace_channel_fk
  FOREIGN KEY (workspace_id, channel_id)
  REFERENCES public.channels(workspace_id, id);

DROP INDEX public.channels_type_external_id_unique_idx;
CREATE UNIQUE INDEX channels_workspace_type_external_id_unique_idx
  ON public.channels (workspace_id, type, external_id)
  WHERE external_id IS NOT NULL;

DROP INDEX public.customer_tags_name_unique_idx;
CREATE UNIQUE INDEX customer_tags_workspace_name_unique_idx
  ON public.customer_tags (workspace_id, lower(name));

DROP INDEX public.conversation_labels_name_unique_idx;
CREATE UNIQUE INDEX conversation_labels_workspace_name_unique_idx
  ON public.conversation_labels (workspace_id, lower(name));

DROP INDEX public.webhook_events_provider_external_event_unique_idx;
CREATE UNIQUE INDEX webhook_events_workspace_provider_event_unique_idx
  ON public.webhook_events (workspace_id, provider, external_event_id);

DROP INDEX public.customers_phone_idx;
CREATE UNIQUE INDEX customers_workspace_phone_unique_idx
  ON public.customers (workspace_id, phone);

DROP INDEX public.customers_email_lower_idx;
CREATE INDEX customers_workspace_email_lower_idx
  ON public.customers (workspace_id, lower(email))
  WHERE email IS NOT NULL;

DROP INDEX public.customer_channels_channel_external_unique_idx;
CREATE UNIQUE INDEX customer_channels_workspace_channel_external_unique_idx
  ON public.customer_channels (workspace_id, channel_id, external_customer_id);

DROP INDEX public.customer_channels_customer_id_idx;
CREATE INDEX customer_channels_workspace_customer_idx
  ON public.customer_channels (workspace_id, customer_id);

DROP INDEX public.customer_tag_assignments_tag_id_idx;
CREATE INDEX customer_tag_assignments_workspace_tag_idx
  ON public.customer_tag_assignments (workspace_id, tag_id, customer_id);

DROP INDEX public.conversations_customer_id_idx;
CREATE INDEX conversations_workspace_customer_idx
  ON public.conversations (workspace_id, customer_id);

DROP INDEX public.conversations_customer_channel_id_idx;
CREATE INDEX conversations_workspace_customer_channel_idx
  ON public.conversations (workspace_id, customer_channel_id);

DROP INDEX public.conversations_status_last_message_idx;
CREATE INDEX conversations_workspace_status_last_message_idx
  ON public.conversations (workspace_id, status, last_message_at DESC);

DROP INDEX public.conversations_assigned_status_last_message_idx;
CREATE INDEX conversations_workspace_assigned_status_last_message_idx
  ON public.conversations (workspace_id, assigned_membership_id, status, last_message_at DESC);

DROP INDEX public.conversations_customer_channel_external_unique_idx;
CREATE UNIQUE INDEX conversations_workspace_channel_external_unique_idx
  ON public.conversations (workspace_id, customer_channel_id, external_id)
  WHERE customer_channel_id IS NOT NULL AND external_id IS NOT NULL;

DROP INDEX public.conversation_label_assignments_label_id_idx;
CREATE INDEX conversation_label_assignments_workspace_label_idx
  ON public.conversation_label_assignments (workspace_id, label_id, conversation_id);

DROP INDEX public.messages_conversation_created_at_idx;
CREATE INDEX messages_workspace_conversation_created_at_idx
  ON public.messages (workspace_id, conversation_id, created_at);

DROP INDEX public.messages_conversation_external_id_unique_idx;
CREATE UNIQUE INDEX messages_workspace_conversation_external_id_unique_idx
  ON public.messages (workspace_id, conversation_id, external_id)
  WHERE external_id IS NOT NULL;

DROP INDEX public.message_attachments_message_id_idx;
CREATE INDEX message_attachments_workspace_message_idx
  ON public.message_attachments (workspace_id, message_id);

DROP INDEX public.webhook_events_status_created_at_idx;
CREATE INDEX webhook_events_workspace_status_created_at_idx
  ON public.webhook_events (workspace_id, status, created_at);

CREATE INDEX audit_logs_workspace_created_at_idx
  ON public.audit_logs (workspace_id, created_at DESC);

COMMIT;