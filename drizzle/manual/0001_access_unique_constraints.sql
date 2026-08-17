-- Access/RBAC uniqueness guarantees.
--
-- The repositories rely on ON CONFLICT DO NOTHING for these keys, but the
-- constraints were never declared, so duplicates could accumulate silently.
-- Every statement is idempotent; re-running is safe.
--
-- Apply with: npm run db:sql -- drizzle/manual/0001_access_unique_constraints.sql
--
-- If a CREATE fails with "Key ... is duplicated", the table already holds
-- duplicates. Inspect and merge them before retrying, e.g.:
--   SELECT lower(email), count(*) FROM public.users GROUP BY 1 HAVING count(*) > 1;
--   SELECT user_id, provider, count(*) FROM public.auth_identities GROUP BY 1,2 HAVING count(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON public.users (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON public.profiles (user_id);

-- One credential maps to exactly one Harmony user.
CREATE UNIQUE INDEX IF NOT EXISTS auth_identities_provider_subject_key ON public.auth_identities (provider, subject);

-- One Harmony user holds at most one credential per provider.
CREATE UNIQUE INDEX IF NOT EXISTS auth_identities_user_provider_key ON public.auth_identities (user_id, provider);

CREATE UNIQUE INDEX IF NOT EXISTS roles_code_key ON public.roles (code);

CREATE UNIQUE INDEX IF NOT EXISTS permissions_code_key ON public.permissions (code);
