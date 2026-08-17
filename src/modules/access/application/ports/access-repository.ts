import type { AccessProfile, PermissionCode, RoleCode } from '../../domain/access';

export interface EnsureIdentityInput {
  provider: string;
  subject: string;
  email: string;
  displayName: string;
}

export interface AccessRepository {
  ensureIdentity(input: EnsureIdentityInput): Promise<AccessProfile>;
  getByAuthIdentity(provider: string, subject: string): Promise<AccessProfile | null>;
  hasPermission(profileId: string, permission: PermissionCode): Promise<boolean>;
  assignRole(profileId: string, role: RoleCode, assignedBy?: string): Promise<void>;
}
