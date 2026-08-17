# Harmony Backoffice — Architecture

## Goal

Build a focused customer messaging backoffice for Harmony that can progressively replace Chatwoot for the workflows Harmony actually uses.

## V1 scope

- Customer directory
- Conversation inbox
- Conversation states: open, pending, resolved
- WhatsApp as the first channel
- Message history
- Human reply composer
- Customer profile, tags and internal notes
- Agent/AI attribution in the transcript

## Domain

The domain follows the useful core of helpdesk systems such as Chatwoot without copying their full product surface:

```text
Customer
  └── Conversation
        ├── Channel (WhatsApp first)
        ├── Status
        ├── Assignment
        └── Message[]
              ├── direction
              ├── senderType (customer | agent | bot)
              └── delivery status
```

## Next.js structure

```text
src/
├── app/
│   ├── layout.tsx       # server layout / metadata
│   ├── page.tsx         # route entrypoint
│   └── globals.css      # Harmony design tokens
├── components/
│   └── harmony-backoffice.tsx # interactive workspace (V1)
├── lib/
│   └── mock-data.ts     # temporary seeded data
└── types/
    └── domain.ts        # customer/conversation/message contracts
```

The App Router entrypoints remain Server Components by default. Interactive state is isolated in the client workspace. As backend integration lands, data loading should move back to server-side services/route handlers and the client component should receive serializable view models.

## Target production architecture

```text
WhatsApp / Agent backend
        │
        ▼
  Channel Adapter
        │
        ▼
 Messaging Service
   ├── Customers
   ├── Conversations
   ├── Messages
   └── Assignments
        │
        ├── PostgreSQL
        └── Realtime events (WebSocket/SSE)
                │
                ▼
        Harmony Backoffice
```

### Recommended boundaries

- `customers`: identity, profile, tags and notes.
- `conversations`: lifecycle, assignment, channel and unread state.
- `messages`: immutable transcript and delivery state.
- `channels`: adapters for WhatsApp/web instead of leaking provider payloads into the UI.
- `realtime`: new message/status events.
- `auth`: staff access and roles.

## Important V1 limitation

The current branch uses seeded in-browser state so the UX can be exercised immediately. Sending a message updates the active conversation locally; it does **not** yet send a WhatsApp message or persist to a database.

## Next implementation slice

1. PostgreSQL schema for customers, conversations and messages.
2. Route handlers/service layer for list/read/send operations.
3. Connect the existing Harmony agent/WhatsApp backend through a channel adapter.
4. Realtime inbound messages.
5. Authentication and staff assignment.
6. Replace mock data with persisted records.
