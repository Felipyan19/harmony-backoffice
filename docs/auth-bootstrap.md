# Bootstrapping and operating access

Authentication and authorization are separate systems in Harmony, and the boundary
between them is the reason this procedure exists:

- **Neon Auth owns credentials.** Emails, passwords, hashes, sessions. The app reads
  `neon_auth` at most for diagnostics and never writes to it.
- **PostgreSQL owns entitlement.** `users`, `profiles`, `auth_identities`,
  `profile_roles`. A valid session proves who you are; only these tables decide what
  you may do.

## Why the first admin cannot be created from code

Neon's Admin APIs (`auth.admin.createUser`, `setRole`, `banUser`) require the caller
to already hold an authenticated session with the `admin` role, and the admin role
itself can only be granted the first time from the Neon Console. There is no
service-key path for the app to create the first credential, by design.

So the first admin is created by a human in the Console, and the app links it.

### Step 1 — create the credential in the Neon Console

Project → **Auth** → **Users** → **Create user**. Set the email and password there.

### Step 2 — link it to the Harmony admin role

```bash
# Inspect the current state without changing anything
npm run auth:bootstrap-admin -- someone@harmony.com --check

# Create/repair the users + profiles + auth_identities + admin role records
npm run auth:bootstrap-admin -- someone@harmony.com
```

The script is idempotent and never touches passwords. It reports exactly what it
found and what it changed. Re-running after a partial failure is safe — which is
precisely what the deleted login-page "repair" flow could not do.

### Step 3 — everyone else goes through the backoffice

From `/usuarios`, an admin creates users through `UserAdminService`, which calls
`auth.admin.createUser` and then writes the matching RBAC records. The bootstrap
script is only for the first admin and for ops recovery.

## What sign-in is allowed to do

`PostgresAccessRepository.resolveIdentity` links an authenticated subject to a
**pre-existing** invited user, matched by email, and nothing more. It never creates
a user, a profile, or a role grant. Denials are explicit:

| Reason | Meaning |
| --- | --- |
| `not-invited` | Authenticated, but no `users` row. Nobody granted this person access. |
| `no-profile` | Invited but never given a profile — provisioning was left half-done. |
| `subject-mismatch` | The user is already linked to a different credential. Ops must relink. |

`subject-mismatch` is deliberately not self-service. If a credential is recreated,
run `auth:bootstrap-admin` (or the equivalent ops action) to relink it. A sign-in
attempt must never be able to rebind an account to a new credential — that is an
account-takeover primitive, not a recovery flow.

## Debugging a failed sign-in

Work outwards from the credential:

1. **`npm run auth:bootstrap-admin -- <email> --check`** — is there a credential at
   all, does it have a `credential` provider row (i.e. a password), and does it
   resolve to an active admin profile?
2. **Environment pairing.** `NEON_AUTH_BASE_URL` and `DATABASE_URL` must point at the
   same Neon project *and branch*. When they drift — easy to do with Vercel preview
   deployments and Neon branching — the user visibly exists in the database while the
   auth server rejects the password with `INVALID_EMAIL_OR_PASSWORD`, because the
   credential lives on a different branch. This mismatch looks exactly like a wrong
   password.
3. **`NEON_AUTH_COOKIE_SECRET`** must be at least 32 characters, or session cookies
   never validate.
4. **Error codes.** `signIn.email` returns a `code` on the error object;
   `INVALID_EMAIL_OR_PASSWORD`, `USER_BANNED`, `EMAIL_NOT_VERIFIED` and
   `TOO_MANY_REQUESTS` are mapped to Spanish copy in `login-form.tsx`. Anything else
   falls back to a generic message — check the Network tab for the real code.

## Database constraints

The access tables rely on uniqueness that was never declared. Apply once per
environment:

```bash
npm run db:sql -- drizzle/manual/0001_access_unique_constraints.sql
```

Without those indexes, `ON CONFLICT DO NOTHING` in the repositories is a no-op
guard and duplicate identities/profiles accumulate silently.
