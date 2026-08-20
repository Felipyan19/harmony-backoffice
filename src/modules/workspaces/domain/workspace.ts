import type { RoleCode } from '@/modules/access/domain/access';

export type PlatformRole = 'owner' | 'admin' | 'support';

export interface WorkspaceBranding {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'disabled';
  branding: WorkspaceBranding;
}

export interface WorkspaceMembership {
  id: string;
  workspaceId: string;
  profileId: string;
  status: 'active' | 'disabled';
  roles: RoleCode[];
}

export interface WorkspaceContext {
  current: WorkspaceSummary;
  available: WorkspaceSummary[];
  membership: WorkspaceMembership;
  platformRole?: PlatformRole;
}
