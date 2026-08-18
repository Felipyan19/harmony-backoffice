# Harmony Backoffice — Architecture

## Goal

Build a focused Harmony backoffice with portable PostgreSQL persistence and strict module boundaries. Infrastructure providers must be replaceable without changing domain or application use cases.

## Core architecture

```text
Next.js App Router
        │
        ├── Server Components / Server Actions
        │
        ▼
       DAL
  session + RBAC checks
        │
        ▼
Application use cases
        │
        ▼
       Ports
   ┌────┼───────────┐
   ▼    ▼           ▼
Users  Messaging  Authentication
   │    │           │
   └────┴─────┬─────┘
              ▼
       Infrastructure
       Drizzle + pg
              │
              ▼
          PostgreSQL
```

Neon is currently only the PostgreSQL host. Runtime code uses `pg` and `drizzle-orm/node-postgres`, so moving to a self-managed PostgreSQL server is a `DATABASE_URL`/infrastructure operation rather than a domain rewrite.

## Authentication

Authentication is application-owned. There is no runtime dependency on Neon Auth.

```text
/login
  │
  ▼
Auth.js v5 Credentials
  │
  ▼
AuthenticateUser
  ├── CredentialRepository
  └── PasswordHasher
         │
         ▼
      Argon2id
  │
  ▼
PostgreSQL
  ├── users
  ├── password_credentials
  └── profiles
```

Auth.js uses JWT sessions for credentials. Tokens carry stable identity and `sessionVersion`, not roles or permissions. `users.session_version` supports explicit session revocation when an account is disabled or credentials are reset.

## Authorization

Authentication and authorization remain separate:

```text
Auth.js session.user.id
        │
        ▼
      profiles
        │
        ▼
  profile_roles
        │
        ▼
       roles
        │
        ▼
 role_permissions
        │
        ▼
   permissions
```

`requirePermission()` is the server-side authorization boundary for sensitive reads/mutations. Proxy/middleware performs only an early session redirect. The browser is never authoritative for RBAC.

## User administration

User creation, credential persistence, profile creation and role grants are one PostgreSQL transaction. Password hashing is behind the `PasswordHasher` port. Status changes increment `session_version`; deletion is handled locally with database relationships instead of coordinating an external identity provider.

## Messaging domain

```text
Customer
  └── Conversation
        ├── Channel
        ├── Status
        ├── Assignment
        └── Message[]
              ├── direction
              ├── senderType
              └── delivery status
```

Target messaging flow:

```text
WhatsApp / Harmony Agent
        │
        ▼
   Channel Adapter
        │
        ▼
 Messaging application
   ├── Customers
   ├── Conversations
   ├── Messages
   └── Assignments
        │
        ▼
     PostgreSQL
        │
        └── realtime events
                │
                ▼
        Harmony Backoffice
```

The frontend must not depend directly on Meta/WhatsApp APIs. Channel-specific payloads stay behind adapters.

## Modules

- `authentication`: credentials, hashing contract and authentication use case.
- `access`: profiles, roles, permissions and authorization queries.
- `users`: staff lifecycle and role administration.
- `customers`: customer identity, tags and notes.
- `conversations`: lifecycle, assignment and unread state.
- `messages`: transcript and delivery state.
- `channels`: WhatsApp/web/Instagram adapters as they are introduced.

## Current product limitation

The messaging workspace still uses seeded client-side mock data for part of the V1 UX. Authentication, RBAC and user administration are being moved to real PostgreSQL first; persisted messaging/realtime integration remains a separate implementation slice.
