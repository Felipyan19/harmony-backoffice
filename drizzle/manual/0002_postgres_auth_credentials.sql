-- Harmony app-owned authentication schema.
-- Idempotent and intentionally leaves legacy auth_identities/neon_auth data untouched for rollback.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 1;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

CREATE TABLE IF NOT EXISTS public.password_credentials (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  must_change_password boolean NOT NULL DEFAULT false,
  failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until timestamptz
);

CREATE INDEX IF NOT EXISTS password_credentials_locked_until_idx
  ON public.password_credentials(locked_until)
  WHERE locked_until IS NOT NULL;
