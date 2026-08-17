# Users module

The Users module follows three reference patterns:

- Next.js: authorization is rechecked inside every Server Action, not only in navigation/UI.
- Neon Auth: identity lifecycle uses the managed admin APIs (`createUser`, `banUser`/`unbanUser`, `removeUser`).
- Harmony RBAC: profile data, roles, permissions and audit logs stay in PostgreSQL behind application ports so Neon can be replaced later.

The initial CRUD supports create, edit profile, enable/disable access, assign one or more roles, and delete users. Self-disable and self-delete are rejected.
