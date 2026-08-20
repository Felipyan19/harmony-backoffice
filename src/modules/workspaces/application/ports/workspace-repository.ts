import type { PlatformRole, WorkspaceMembership, WorkspaceSummary } from '../../domain/workspace';

export interface CreateWorkspacePersistenceInput {
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  actorProfileId: string;
  adminEmail: string;
  adminDisplayName: string;
  adminPasswordHash: string;
}

export interface WorkspaceRepository {
  listForProfile(profileId: string): Promise<WorkspaceSummary[]>;
  getMembership(profileId: string, workspaceId: string): Promise<WorkspaceMembership | null>;
  getPlatformRole(profileId: string): Promise<PlatformRole | null>;
  create(input: CreateWorkspacePersistenceInput): Promise<WorkspaceSummary>;
}
