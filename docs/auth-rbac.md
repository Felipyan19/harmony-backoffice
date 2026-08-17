# Harmony authentication and authorization

Harmony separates authentication from authorization so the current Neon Auth provider can be replaced later without changing the business domain.

## Identity

`Neon Auth` authenticates users and issues sessions. Harmony owns a stable `users` record and links external authentication identities through `auth_identities` using `(provider, subject)`.

This means a future migration from Neon Auth to Better Auth, Keycloak or an internal PostgreSQL-backed provider only requires adding/relinking auth identities. Harmony user, profile, role and audit identifiers remain stable.

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
