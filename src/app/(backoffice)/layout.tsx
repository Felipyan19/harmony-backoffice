import type { ReactNode } from 'react';
import { getCurrentAccessProfile } from '@/lib/dal/auth';
import { BackofficeStateProvider } from '@/components/backoffice-context';
import { BackofficeShell } from '@/components/backoffice-shell';
import type { RoleCode } from '@/modules/access/domain/access';

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
  const profile = await getCurrentAccessProfile();
  const user = {
    displayName: profile.displayName,
    roleLabel: ROLE_LABELS[profile.roles[0]] ?? 'Miembro del equipo',
    initials: initialsFor(profile.displayName),
  };

  return (
    <BackofficeStateProvider>
      <BackofficeShell user={user}>{children}</BackofficeShell>
    </BackofficeStateProvider>
  );
}
