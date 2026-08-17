# Harmony authentication and authorization

Harmony separates authentication from authorization so the current Neon Auth provider can be replaced later without changing the business domain.

## Identity

`Neon Auth` authenticates users and issues sessions. Harmony owns a stable `users` record and links external authentication identities through `auth_identities` using `(provider, subject)`.

This means a future migration from Neon Auth to Better Auth, Keycloak or an internal PostgreSQL-backed provider only requires adding/relinking auth identities. Harmony user, profile, role and audit identifiers remain stable.

The boundary is one-directional and strict: the app reads `neon_auth` only for
diagnostics and **never writes to it, never reads password hashes, and never
re-implements the provider's password verification**. Credentials are created in the
Neon Console or through `auth.admin.createUser`; see [auth-bootstrap.md](./auth-bootstrap.md).

## Sign-in grants nothing by itself

A valid session proves identity, not entitlement. On sign-in,
`AccessRepository.resolveIdentity` links the authenticated subject to a user that was
**already invited** from the backoffice, and refuses everything else — it never
creates a user, profile or role grant, and never rebinds a user to a new credential.
Provisioning belongs to the users module (admin-driven) and to the bootstrap script
(ops-driven).

## Authorization

Authorization is app-owned RBAC:

- `profiles`: employee/person metadata and active/disabled status.
- `roles`: reusable role definitions.
- `permissions`: granular capabilities.
- `profile_roles`: many-to-many profile/role assignments.
- `role_permissions`: many-to-many role/permission assignments.
- `audit_logs`: records actions performed by internal profiles.

System roles initially provided: `admin`, `agent`, `receptionist`.

## Hexagonal boundary

The application layer depends on `AccessRepository`; PostgreSQL implements that port in `PostgresAccessRepository`. Neon is only the current connection provider and must not leak into domain or application code.
