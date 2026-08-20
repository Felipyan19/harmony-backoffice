import type { ReactNode } from 'react';
import { backoffice } from '@/composition/backoffice';
import { getCurrentAccessProfile, getCurrentWorkspaceContext } from '@/lib/dal/auth';
import { BackofficeStateProvider } from '@/components/backoffice-context';
import { BackofficeShell } from '@/components/backoffice-shell';
import type { RoleCode } from '@/modules/access/domain/access';
import type { ConversationLabel } from '@/modules/conversations/domain/conversation';

export const dynamic = 'force-dynamic';

const ROLE_LABELS: Record<RoleCode, string> = {
  admin: 'Administrador',
  agent: 'Agente',
  receptionist: 'Recepcionista',
};

function initialsFor(name: string) {
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('');
  return initials.toUpperCase() || '?';
}

export default async function BackofficeLayout({ children }: { children: ReactNode }) {
  const [profile, workspaceContext] = await Promise.all([
    getCurrentAccessProfile(),
    getCurrentWorkspaceContext(),
  ]);

  const [customers, conversations] = await Promise.all([
    backoffice.customers.list.execute(workspaceContext.current.id),
    backoffice.conversations.list.execute(workspaceContext.current.id),
  ]);

  const labelMap = new Map<string, ConversationLabel>();
  for (const conversation of conversations) {
    for (const label of conversation.labels) labelMap.set(label.id, label);
  }

  const user = {
    displayName: profile.displayName,
    roleLabel: ROLE_LABELS[profile.roles[0]] ?? 'Miembro del equipo',
    initials: initialsFor(profile.displayName),
  };

  return (
    <BackofficeStateProvider
      initialCustomers={customers}
      initialConversations={conversations}
      initialLabels={Array.from(labelMap.values())}
    >
      <BackofficeShell
        user={user}
        workspace={workspaceContext.current}
        availableWorkspaces={workspaceContext.available}
        platformRole={workspaceContext.platformRole}
      >
        {children}
      </BackofficeShell>
    </BackofficeStateProvider>
  );
}
