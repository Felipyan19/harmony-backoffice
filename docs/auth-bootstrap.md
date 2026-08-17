# Authentication and access operations

Harmony owns authentication and authorization in PostgreSQL. Neon is only the current PostgreSQL host and is not an authentication dependency.

## Ownership boundary

- **Auth.js v5** handles the Next.js sign-in/session protocol.
- **PostgreSQL** owns users, password credentials, profiles, roles, permissions and audit history.
- **Argon2id** hashes passwords behind the `PasswordHasher` application port.
- **RBAC is server-authoritative.** Roles and permissions are read from PostgreSQL for protected operations; they are not trusted from the browser or copied into the JWT as authorization state.

The relevant flow is:

```text
/login
  -> Auth.js Credentials provider
  -> AuthenticateUser
  -> CredentialRepository + PasswordHasher
  -> PostgreSQL
  -> Auth.js JWT session
  -> DAL requirePermission(...)
  -> PostgreSQL RBAC
```

## Environment

Only these authentication/database variables are required:

```env
DATABASE_URL=
AUTH_SECRET=
```

Generate `AUTH_SECRET` with the Auth.js CLI (`npx auth secret`) or another cryptographically secure secret generator. Never commit it.

## Database migration

Before enabling the new authentication flow, apply:

```bash
npm run db:sql -- drizzle/manual/0002_postgres_auth_credentials.sql
```

The migration is idempotent. Legacy `neon_auth` and `auth_identities` data are intentionally not dropped during the cutover so rollback remains possible. Runtime authentication does not read either of them.

## First administrator / credential recovery

Bootstrap is an **ops action**, never a public route or Server Action. The script is idempotent and executes the user credential, profile, admin role and audit changes inside one database transaction.

Read-only check:

```bash
BOOTSTRAP_ADMIN_EMAIL=admin@example.com \
npm run auth:bootstrap-admin -- --check
```

Create or reset the first administrator:

```bash
BOOTSTRAP_ADMIN_EMAIL=admin@example.com \
BOOTSTRAP_ADMIN_PASSWORD='use-a-strong-password' \
BOOTSTRAP_ADMIN_NAME='System Administrator' \
npm run auth:bootstrap-admin
```

The password is hashed with Argon2id before persistence. Resetting an existing administrator increments `users.session_version`, invalidating previously issued sessions on their next server-side access check.

## Normal user lifecycle

Administrators manage users from `/usuarios`. Creation is a single PostgreSQL transaction covering the internal user, password credential, profile and role grants. Updating active/disabled status also increments `session_version`, so disabling an account revokes existing sessions. Deletion relies on database ownership/cascades and is never split between the browser and an external identity provider.

## Sign-in and authorization rules

A valid password only creates an authenticated Auth.js session. It does not grant permissions. The server resolves the session `user.id` to the app-owned user/profile and checks RBAC in PostgreSQL.

The credential path deliberately returns a generic rejection for unknown emails, incorrect passwords, disabled users and active lockouts. This avoids exposing whether a particular account exists. Five consecutive failures produce a temporary 15-minute credential lock; a successful authentication resets the counter.

Protected Server Actions must call `requirePermission(...)` before performing a mutation. The route proxy is only an early unauthenticated redirect; it is not the authorization boundary.

## Session revocation

Auth.js uses JWT sessions for the Credentials provider. The JWT contains only stable identity/session metadata (`user.id` and `sessionVersion`), not the effective permission set. The DAL compares the token's version with `users.session_version` on server-side access. Incrementing the database value invalidates prior sessions without embedding mutable authorization into the token.

## Legacy cleanup

Do not drop `neon_auth` or `auth_identities` during the initial cutover. Once production has been stable and rollback is no longer required, remove those legacy objects in a separate reviewed migration. No current authentication or RBAC code should depend on them.
