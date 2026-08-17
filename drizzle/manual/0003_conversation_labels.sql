CREATE TABLE IF NOT EXISTS public.conversation_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT 'zinc',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS conversation_labels_name_unique_idx
  ON public.conversation_labels (lower(name));

CREATE TABLE IF NOT EXISTS public.conversation_label_assignments (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES public.conversation_labels(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, label_id)
);

CREATE INDEX IF NOT EXISTS conversation_label_assignments_label_id_idx
  ON public.conversation_label_assignments (label_id, conversation_id);
