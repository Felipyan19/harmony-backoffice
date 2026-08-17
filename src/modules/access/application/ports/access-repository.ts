import type { AccessProfile, PermissionCode, RoleCode } from '../../domain/access';

export interface AccessRepository {
  getByUserId(userId: string): Promise<AccessProfile | null>;
  hasPermission(profileId: string, permission: PermissionCode): Promise<boolean>;
  assignRole(profileId: string, role: RoleCode, assignedBy?: string): Promise<void>;
}
