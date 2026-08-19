import type { AccessProfile, PermissionCode } from '../../domain/access';

export interface AccessRepository {
  getIdentityByUserId(userId: string): Promise<AccessProfile | null>;
  getByUserId(userId: string, workspaceId: string): Promise<AccessProfile | null>;
  hasPermission(profileId: string, workspaceId: string, permission: PermissionCode): Promise<boolean>;
}
