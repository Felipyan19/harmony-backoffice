import type { PasswordHasher } from '@/modules/authentication/application/ports/password-hasher';
import type { WorkspaceRepository } from './ports/workspace-repository';

export class WorkspaceService {
  constructor(
    private readonly workspaces: WorkspaceRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  listForProfile(profileId: string) {
    return this.workspaces.listForProfile(profileId);
  }

  getMembership(profileId: string, workspaceId: string) {
    return this.workspaces.getMembership(profileId, workspaceId);
  }

  getPlatformRole(profileId: string) {
    return this.workspaces.getPlatformRole(profileId);
  }

  async create(input: {
    name: string;
    slug: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    actorProfileId: string;
    adminEmail: string;
    adminDisplayName: string;
    adminPassword: string;
  }) {
    const adminPasswordHash = await this.passwordHasher.hash(input.adminPassword);
    return this.workspaces.create({
      ...input,
      adminPasswordHash,
    });
  }
}
